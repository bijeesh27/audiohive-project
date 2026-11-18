import { Types } from "mongoose";
import { IsuperAdminSubscriptionsRepository } from "../domain/IsuperAdminSubscriptionsRepository.ts";
import { SubscriptionModel, ISubscriptionDocument } from "../../subscription/infrastructure/subscriptionSchema.ts";
import { OrganizationModel } from "../../organization/infrastructure/organizationSchema.ts";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema.ts";
import { ActivityLogModel } from "../../activityLog/infrastructure/activitylogSchema.ts";
import { AppError } from "../../../common/Errors/AppError.ts";
import { HttpStatus } from "../../../common/constant/httpStatus.ts";
import {
  SuperAdminPlanDTO,
  CreateOrUpdatePlanDTO,
  PlanImpactCheckResultDTO,
  SuperAdminSubscriptionsFilterDTO,
  SuperAdminSubscriptionsResponseDTO,
  SuperAdminSubscriptionItemDTO,
} from "../application/dtos/SuperAdminSubscriptionDTO.ts";

export class SuperAdminSubscriptionsRepository implements IsuperAdminSubscriptionsRepository {
  /**
   * Retrieves all subscription plans with real-time subscriber counts and usage statistics.
   */
  async getAllPlans(): Promise<SuperAdminPlanDTO[]> {
    const [rawPlans, allOrgs] = await Promise.all([
      SubscriptionModel.find({}).sort({ displayOrder: 1, price: 1 }).lean(),
      OrganizationModel.find({ status: { $ne: "archived" } }).select("_id planId status").lean(),
    ]);

    // Map subscriber counts
    const totalSubscribersByPlanId = new Map<string, number>();
    const activeSubscribersByPlanId = new Map<string, number>();

    for (const org of allOrgs) {
      const pId = String(org.planId || "free");
      totalSubscribersByPlanId.set(pId, (totalSubscribersByPlanId.get(pId) || 0) + 1);
      if (org.status === "active") {
        activeSubscribersByPlanId.set(pId, (activeSubscribersByPlanId.get(pId) || 0) + 1);
      }
    }

    return rawPlans.map((p) => {
      const idStr = p._id.toString();
      const isFree = p.subscriptionName.toLowerCase() === "free" || p.key === "free";

      let subscriberCount = totalSubscribersByPlanId.get(idStr) || 0;
      let activeSubscriberCount = activeSubscribersByPlanId.get(idStr) || 0;

      // Also aggregate literal 'free' for the free plan
      if (isFree) {
        subscriberCount += totalSubscribersByPlanId.get("free") || 0;
        activeSubscriberCount += activeSubscribersByPlanId.get("free") || 0;
      }

      const status = (p.status as "active" | "inactive" | "archived") || (p.isActive ? "active" : "inactive");

      return {
        _id: idStr,
        subscriptionName: p.subscriptionName,
        key: p.key || p.subscriptionName.toLowerCase().replace(/\s+/g, "-"),
        price: p.price,
        currency: p.currency || "INR",
        interval: p.interval || "month",
        description: p.description,
        maxWorkspaces: p.maxWorkspaces,
        maxRooms: p.maxRooms ?? 10,
        features: p.features || [],
        isActive: status === "active",
        status,
        isDefault: Boolean(p.isDefault),
        isRecommended: Boolean(p.isRecommended),
        displayOrder: typeof p.displayOrder === "number" ? p.displayOrder : 0,
        subscriberCount,
        activeSubscriberCount,
        createdAt: (p as unknown as { createdAt?: Date }).createdAt?.toISOString(),
        updatedAt: (p as unknown as { updatedAt?: Date }).updatedAt?.toISOString(),
      };
    });
  }

  /**
   * Verifies if lowering a plan's maxWorkspaces will cause any current subscribers to exceed limits.
   */
  async checkPlanImpact(planId: string, newMaxWorkspaces: number): Promise<PlanImpactCheckResultDTO> {
    const plan = await SubscriptionModel.findById(planId).lean();
    if (!plan) {
      throw new AppError("Plan not found", HttpStatus.NOT_FOUND);
    }

    const isFree = plan.subscriptionName.toLowerCase() === "free" || plan.key === "free";
    const planIdMatches = isFree ? [plan._id.toString(), "free"] : [plan._id.toString()];

    const subscriberOrgs = await OrganizationModel.find({
      planId: { $in: planIdMatches },
      status: { $ne: "archived" },
    }).select("_id companyName slug").lean();

    const affectedOrganizations: Array<{
      _id: string;
      companyName: string;
      slug: string;
      currentWorkspaces: number;
      allowedWorkspaces: number;
      exceededBy: number;
    }> = [];

    for (const org of subscriberOrgs) {
      const activeWsCount = await WorkspaceModel.countDocuments({
        organizationId: org._id,
        status: { $ne: "archived" },
      });

      if (activeWsCount > newMaxWorkspaces) {
        affectedOrganizations.push({
          _id: org._id.toString(),
          companyName: org.companyName,
          slug: org.slug,
          currentWorkspaces: activeWsCount,
          allowedWorkspaces: newMaxWorkspaces,
          exceededBy: activeWsCount - newMaxWorkspaces,
        });
      }
    }

    const canSave = affectedOrganizations.length === 0;
    const warningMessage = !canSave
      ? `Cannot save: ${affectedOrganizations.length} organization(s) currently exceed the new limit of ${newMaxWorkspaces} workspaces.`
      : undefined;

    return {
      canSave,
      subscriberCount: subscriberOrgs.length,
      affectedOrganizations,
      warningMessage,
    };
  }

  /**
   * Creates a new plan with server validation.
   */
  async createPlan(dto: CreateOrUpdatePlanDTO, actorId?: string, actorEmail?: string): Promise<SuperAdminPlanDTO> {
    const trimmedName = dto.subscriptionName.trim();
    if (!trimmedName) {
      throw new AppError("Plan name is required", HttpStatus.BAD_REQUEST);
    }

    const key = (dto.key || trimmedName.toLowerCase().replace(/\s+/g, "-")).trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(key)) {
      throw new AppError("Plan key must contain only lowercase letters, numbers, and hyphens", HttpStatus.BAD_REQUEST);
    }

    const existingKey = await SubscriptionModel.findOne({ $or: [{ key }, { subscriptionName: trimmedName }] });
    if (existingKey) {
      throw new AppError(`A plan with the name "${trimmedName}" or key "${key}" already exists`, HttpStatus.CONFLICT);
    }

    if (dto.price < 0) {
      throw new AppError("Price cannot be negative", HttpStatus.BAD_REQUEST);
    }

    if (dto.maxWorkspaces < 1) {
      throw new AppError("Maximum workspaces must be at least 1", HttpStatus.BAD_REQUEST);
    }

    // Default plan rule: if setting as default, clear others
    if (dto.isDefault) {
      await SubscriptionModel.updateMany({}, { isDefault: false });
    }

    const status = dto.status || (dto.isActive !== false ? "active" : "inactive");
    const isActive = status === "active";

    const created = await SubscriptionModel.create({
      subscriptionName: trimmedName,
      key,
      price: dto.price,
      currency: dto.currency || "INR",
      interval: dto.interval || "month",
      description: dto.description.trim(),
      maxWorkspaces: dto.maxWorkspaces,
      maxRooms: dto.maxRooms ?? 10,
      features: dto.features || [],
      isActive,
      status,
      isDefault: Boolean(dto.isDefault),
      isRecommended: Boolean(dto.isRecommended),
      displayOrder: typeof dto.displayOrder === "number" ? dto.displayOrder : 0,
    });

    // Write audit log
    await ActivityLogModel.create({
      occurredAt: new Date(),
      action: "CREATE_PLAN",
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorName: "Super Admin",
      actorEmail,
      targetType: "SUBSCRIPTION_PLAN",
      targetId: created._id.toString(),
      metadata: {
        subscriptionName: created.subscriptionName,
        key: created.key,
        price: created.price,
        maxWorkspaces: created.maxWorkspaces,
      },
    });

    const all = await this.getAllPlans();
    return all.find((p) => p._id === created._id.toString())!;
  }

  /**
   * Updates an existing plan, preventing invalid reductions and ensuring default rules.
   */
  async updatePlan(
    planId: string,
    dto: CreateOrUpdatePlanDTO,
    actorId?: string,
    actorEmail?: string
  ): Promise<SuperAdminPlanDTO> {
    const plan = await SubscriptionModel.findById(planId);
    if (!plan) {
      throw new AppError("Plan not found", HttpStatus.NOT_FOUND);
    }

    const trimmedName = dto.subscriptionName.trim();
    if (!trimmedName) {
      throw new AppError("Plan name is required", HttpStatus.BAD_REQUEST);
    }

    const key = (dto.key || plan.key || trimmedName.toLowerCase().replace(/\s+/g, "-")).trim().toLowerCase();

    // Key immutability check if subscribers exist
    const isFree = plan.subscriptionName.toLowerCase() === "free" || plan.key === "free";
    const planIdMatches = isFree ? [plan._id.toString(), "free"] : [plan._id.toString()];
    const subscriberCount = await OrganizationModel.countDocuments({
      planId: { $in: planIdMatches },
      status: { $ne: "archived" },
    });

    if (plan.key && plan.key !== key && subscriberCount > 0) {
      throw new AppError(
        `Plan key cannot be modified because ${subscriberCount} organization(s) are currently subscribed to this plan.`,
        HttpStatus.FORBIDDEN
      );
    }

    // Impact check: if lowering maxWorkspaces below current subscriber usage
    if (dto.maxWorkspaces < plan.maxWorkspaces && subscriberCount > 0) {
      const impact = await this.checkPlanImpact(planId, dto.maxWorkspaces);
      if (!impact.canSave) {
        throw new AppError(
          `Cannot lower workspace limit to ${dto.maxWorkspaces}. ${impact.affectedOrganizations.length} subscribed organization(s) currently exceed this limit: ${impact.affectedOrganizations.map((o) => `${o.companyName} (${o.currentWorkspaces} workspaces)`).join(", ")}.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Default plan rules
    if (dto.isDefault && !plan.isDefault) {
      await SubscriptionModel.updateMany({}, { isDefault: false });
      plan.isDefault = true;
    }

    const previousSnapshot = {
      subscriptionName: plan.subscriptionName,
      price: plan.price,
      maxWorkspaces: plan.maxWorkspaces,
      features: [...plan.features],
      status: plan.status,
    };

    plan.subscriptionName = trimmedName;
    plan.key = key;
    plan.price = dto.price;
    if (dto.currency) plan.currency = dto.currency;
    if (dto.interval) plan.interval = dto.interval;
    plan.description = dto.description.trim();
    plan.maxWorkspaces = dto.maxWorkspaces;
    if (typeof dto.maxRooms === "number") plan.maxRooms = dto.maxRooms;
    plan.features = dto.features || [];
    if (typeof dto.displayOrder === "number") plan.displayOrder = dto.displayOrder;
    if (typeof dto.isRecommended === "boolean") plan.isRecommended = dto.isRecommended;

    if (dto.status) {
      plan.status = dto.status;
      plan.isActive = dto.status === "active";
    }

    await plan.save();

    // Audit log
    await ActivityLogModel.create({
      occurredAt: new Date(),
      action: "UPDATE_PLAN",
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorName: "Super Admin",
      actorEmail,
      targetType: "SUBSCRIPTION_PLAN",
      targetId: plan._id.toString(),
      metadata: {
        planId: plan._id.toString(),
        previous: previousSnapshot,
        updated: {
          subscriptionName: plan.subscriptionName,
          price: plan.price,
          maxWorkspaces: plan.maxWorkspaces,
          features: plan.features,
          status: plan.status,
        },
      },
    });

    const all = await this.getAllPlans();
    return all.find((p) => p._id === plan._id.toString())!;
  }

  /**
   * Toggles plan status between active, inactive, and archived.
   */
  async updatePlanStatus(
    planId: string,
    status: "active" | "inactive" | "archived",
    actorId?: string,
    actorEmail?: string
  ): Promise<SuperAdminPlanDTO> {
    const plan = await SubscriptionModel.findById(planId);
    if (!plan) {
      throw new AppError("Plan not found", HttpStatus.NOT_FOUND);
    }

    if (plan.isDefault && (status === "inactive" || status === "archived")) {
      throw new AppError("The default plan cannot be deactivated or archived. Set another plan as default first.", HttpStatus.FORBIDDEN);
    }

    if (status !== "active") {
      const activeCount = await SubscriptionModel.countDocuments({
        _id: { $ne: plan._id },
        $or: [{ status: "active" }, { isActive: true }],
      });
      if (activeCount === 0) {
        throw new AppError("At least one active plan must always exist on the platform.", HttpStatus.FORBIDDEN);
      }
    }

    const previousStatus = plan.status || (plan.isActive ? "active" : "inactive");
    plan.status = status;
    plan.isActive = status === "active";
    await plan.save();

    await ActivityLogModel.create({
      occurredAt: new Date(),
      action: "UPDATE_PLAN_STATUS",
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorName: "Super Admin",
      actorEmail,
      targetType: "SUBSCRIPTION_PLAN",
      targetId: plan._id.toString(),
      metadata: {
        planName: plan.subscriptionName,
        previousStatus,
        newStatus: status,
      },
    });

    const all = await this.getAllPlans();
    return all.find((p) => p._id === plan._id.toString())!;
  }

  /**
   * Sets a plan as the system default assigned to new organizations.
   */
  async setDefaultPlan(planId: string, actorId?: string, actorEmail?: string): Promise<SuperAdminPlanDTO> {
    const plan = await SubscriptionModel.findById(planId);
    if (!plan) {
      throw new AppError("Plan not found", HttpStatus.NOT_FOUND);
    }

    if (plan.status === "inactive" || plan.status === "archived" || !plan.isActive) {
      throw new AppError("Only an active plan can be set as the default plan.", HttpStatus.BAD_REQUEST);
    }

    await SubscriptionModel.updateMany({}, { isDefault: false });
    plan.isDefault = true;
    await plan.save();

    await ActivityLogModel.create({
      occurredAt: new Date(),
      action: "SET_DEFAULT_PLAN",
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorName: "Super Admin",
      actorEmail,
      targetType: "SUBSCRIPTION_PLAN",
      targetId: plan._id.toString(),
      metadata: { planName: plan.subscriptionName },
    });

    const all = await this.getAllPlans();
    return all.find((p) => p._id === plan._id.toString())!;
  }

  /**
   * Deletes a plan only when it has 0 subscribers and is not the default plan.
   */
  async deletePlan(planId: string, actorId?: string, actorEmail?: string): Promise<{ success: boolean; message: string }> {
    const plan = await SubscriptionModel.findById(planId);
    if (!plan) {
      throw new AppError("Plan not found", HttpStatus.NOT_FOUND);
    }

    const isFree = plan.subscriptionName.toLowerCase() === "free" || plan.key === "free";
    const planIdMatches = isFree ? [plan._id.toString(), "free"] : [plan._id.toString()];
    const subscriberCount = await OrganizationModel.countDocuments({
      planId: { $in: planIdMatches },
      status: { $ne: "archived" },
    });

    if (subscriberCount > 0) {
      throw new AppError(
        `Cannot delete plan "${plan.subscriptionName}" because ${subscriberCount} organization(s) are currently subscribed to it. Please archive the plan instead.`,
        HttpStatus.FORBIDDEN
      );
    }

    if (plan.isDefault) {
      throw new AppError("The default plan cannot be deleted.", HttpStatus.FORBIDDEN);
    }

    const activeCount = await SubscriptionModel.countDocuments({
      _id: { $ne: plan._id },
      $or: [{ status: "active" }, { isActive: true }],
    });
    if (activeCount === 0) {
      throw new AppError("Cannot delete the only active plan on the platform.", HttpStatus.FORBIDDEN);
    }

    await SubscriptionModel.findByIdAndDelete(planId);

    await ActivityLogModel.create({
      occurredAt: new Date(),
      action: "DELETE_PLAN",
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorName: "Super Admin",
      actorEmail,
      targetType: "SUBSCRIPTION_PLAN",
      targetId: planId,
      metadata: {
        deletedPlanName: plan.subscriptionName,
        price: plan.price,
      },
    });

    return { success: true, message: `Plan "${plan.subscriptionName}" deleted successfully.` };
  }

  /**
   * Subscriptions tab: Lists all organization subscriptions with usage, search, and filters.
   */
  async getSubscriptions(filter: SuperAdminSubscriptionsFilterDTO): Promise<SuperAdminSubscriptionsResponseDTO> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));

    const [allPlans, allWorkspaces] = await Promise.all([
      SubscriptionModel.find({}).lean(),
      WorkspaceModel.find({ status: { $ne: "archived" } }).select("_id organizationId").lean(),
    ]);

    const planById = new Map<string, (typeof allPlans)[0]>();
    let freePlan: (typeof allPlans)[0] | null = null;
    for (const p of allPlans) {
      planById.set(p._id.toString(), p);
      if (p.subscriptionName.toLowerCase() === "free" || p.key === "free") {
        freePlan = p;
      }
    }

    const workspacesCountByOrg = new Map<string, number>();
    for (const ws of allWorkspaces) {
      if (ws.organizationId) {
        const orgIdStr = ws.organizationId.toString();
        workspacesCountByOrg.set(orgIdStr, (workspacesCountByOrg.get(orgIdStr) || 0) + 1);
      }
    }

    const orgQuery: Record<string, unknown> = {
      status: { $ne: "archived" },
    };

    if (filter.status && filter.status !== "all") {
      orgQuery.status = filter.status.toLowerCase();
    }

    if (filter.search && filter.search.trim()) {
      const s = filter.search.trim();
      orgQuery.$or = [
        { companyName: { $regex: s, $options: "i" } },
        { slug: { $regex: s, $options: "i" } },
        { ownerName: { $regex: s, $options: "i" } },
        { ownerEmail: { $regex: s, $options: "i" } },
      ];
    }

    const orgs = await OrganizationModel.find(orgQuery).sort({ createdAt: -1 }).lean();

    const items: SuperAdminSubscriptionItemDTO[] = [];

    for (const org of orgs) {
      const orgIdStr = org._id.toString();
      const pId = String(org.planId || "free");
      let matchedPlan = planById.get(pId);
      if (!matchedPlan && (pId === "free" || pId.toLowerCase() === "free")) {
        matchedPlan = freePlan || undefined;
      }

      const planName = matchedPlan ? matchedPlan.subscriptionName : "Free";
      const planPrice = matchedPlan ? matchedPlan.price : 0;
      const planCurrency = matchedPlan?.currency || "INR";
      const planInterval = matchedPlan?.interval || "month";
      const maxWs = matchedPlan ? matchedPlan.maxWorkspaces : 2;

      const currentWs = workspacesCountByOrg.get(orgIdStr) || 0;
      const usagePercent = maxWs > 0 ? Math.min(100, Math.round((currentWs / maxWs) * 100)) : 0;
      const nearLimit = maxWs > 0 && usagePercent >= 80;

      items.push({
        organizationId: orgIdStr,
        companyName: org.companyName,
        slug: org.slug,
        ownerName: org.ownerName,
        ownerEmail: org.ownerEmail,
        orgStatus: org.status as "active" | "suspended" | "pending" | "archived",
        plan: {
          _id: matchedPlan ? matchedPlan._id.toString() : "free",
          subscriptionName: planName,
          price: planPrice,
          currency: planCurrency,
          interval: planInterval,
          maxWorkspaces: maxWs,
        },
        startedAt: (org as unknown as { createdAt?: Date }).createdAt
          ? new Date((org as unknown as { createdAt: Date }).createdAt).toISOString()
          : new Date().toISOString(),
        workspacesCount: currentWs,
        nearLimit,
        usagePercent,
      });
    }

    // Filter in-memory for derived fields
    let filtered = items;

    if (filter.planId && filter.planId !== "all") {
      filtered = filtered.filter(
        (i) => i.plan._id === filter.planId || (filter.planId === "free" && i.plan.price === 0)
      );
    }

    if (filter.nearLimit) {
      filtered = filtered.filter((i) => i.nearLimit);
    }

    // Sorting
    const sort = filter.sort || "newest";
    filtered.sort((a, b) => {
      if (sort === "name") return a.companyName.localeCompare(b.companyName);
      if (sort === "oldest") return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
      if (sort === "workspaces") return b.workspacesCount - a.workspacesCount;
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paged = filtered.slice(startIndex, startIndex + limit);

    return {
      subscriptions: paged,
      total,
      page,
      limit,
      totalPages,
      filterOptions: {
        plans: allPlans.map((p) => ({
          _id: p._id.toString(),
          subscriptionName: p.subscriptionName,
          price: p.price,
        })),
      },
    };
  }

  /**
   * Changes an organization's subscription plan with usage safety checks and audit logs.
   */
  async changeOrganizationPlan(
    organizationId: string,
    targetPlanId: string,
    actorId?: string,
    actorEmail?: string
  ): Promise<{ success: boolean; message: string }> {
    const org = await OrganizationModel.findById(organizationId);
    if (!org) {
      throw new AppError("Organization not found", HttpStatus.NOT_FOUND);
    }

    const targetPlan = await SubscriptionModel.findById(targetPlanId);
    if (!targetPlan) {
      throw new AppError("Target plan not found", HttpStatus.NOT_FOUND);
    }

    if (targetPlan.status === "archived") {
      throw new AppError("Cannot switch an organization to an archived plan.", HttpStatus.BAD_REQUEST);
    }

    // Check workspace capacity
    const currentWsCount = await WorkspaceModel.countDocuments({
      organizationId: org._id,
      status: { $ne: "archived" },
    });

    if (currentWsCount > targetPlan.maxWorkspaces) {
      throw new AppError(
        `Cannot switch ${org.companyName} to ${targetPlan.subscriptionName}. Organization currently has ${currentWsCount} active workspaces, which exceeds the target plan limit of ${targetPlan.maxWorkspaces}. Reduce workspaces first.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const previousPlanId = org.planId;
    org.planId = targetPlan._id.toString();
    await org.save();

    await ActivityLogModel.create({
      occurredAt: new Date(),
      action: "CHANGE_ORGANIZATION_PLAN",
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorName: "Super Admin",
      actorEmail,
      targetType: "ORGANIZATION",
      targetId: org._id.toString(),
      metadata: {
        organizationName: org.companyName,
        previousPlanId,
        newPlanId: targetPlan._id.toString(),
        newPlanName: targetPlan.subscriptionName,
      },
    });

    return {
      success: true,
      message: `Organization "${org.companyName}" successfully switched to "${targetPlan.subscriptionName}".`,
    };
  }
}
