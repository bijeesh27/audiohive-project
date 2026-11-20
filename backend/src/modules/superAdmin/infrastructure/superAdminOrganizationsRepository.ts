import { IsuperAdminOrganizationsRepository } from "../domain/IsuperAdminOrganizationsRepository.ts";
import {
  SuperAdminOrgQueryDTO,
  SuperAdminOrgListResponseDTO,
  EnrichedOrganizationItem,
  OrganizationDetailResponseDTO,
} from "../application/dtos/SuperAdminOrganizationDTO.ts";
import { OrganizationModel } from "../../organization/infrastructure/organizationSchema.ts";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema.ts";
import { UserModel } from "../../../shared/User.utils/userSchema.ts";
import { SubscriptionModel } from "../../subscription/infrastructure/subscriptionSchema.ts";
import { ActivityLogModel } from "../../activityLog/infrastructure/activitylogSchema.ts";
import { MeetingModel } from "../../meeting/infrastructure/meetingSchema.ts";
import { RoomModel } from "../../room/infrastructure/roomSchema.ts";
import { socketService } from "../../../socket/socketService.ts";
import { formatDuration } from "../../../shared/metrics/sharedMetricsService.ts";

export class SuperAdminOrganizationsRepository
  implements IsuperAdminOrganizationsRepository
{
  private static indexesEnsured = false;

  constructor() {
    this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    if (SuperAdminOrganizationsRepository.indexesEnsured) return;
    try {
      await Promise.allSettled([
        OrganizationModel.collection.createIndex({ status: 1 }),
        OrganizationModel.collection.createIndex({ planId: 1 }),
        OrganizationModel.collection.createIndex({ createdAt: -1 }),
        OrganizationModel.collection.createIndex({ companyName: 1 }),
        OrganizationModel.collection.createIndex({ slug: 1 }),
        WorkspaceModel.collection.createIndex({ organizationId: 1 }),
        ActivityLogModel.collection.createIndex({ organizationId: 1, occurredAt: -1 }),
      ]);
      SuperAdminOrganizationsRepository.indexesEnsured = true;
    } catch {
      // ignore
    }
  }

  async getOrganizations(
    query: SuperAdminOrgQueryDTO
  ): Promise<SuperAdminOrgListResponseDTO> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const searchQuery = query.search?.trim().toLowerCase() || "";
    const planFilter = query.plan?.trim();
    const statusFilter = query.status?.trim();
    const nearLimitFilter =
      query.nearLimit === true || query.nearLimit === "true";
    const sortField = query.sort || "newest";

    // 1. Parallel fetch of core platform data
    const [
      allOrganizations,
      allWorkspaces,
      allUsers,
      allPlans,
      latestLogs,
    ] = await Promise.all([
      OrganizationModel.find().lean(),
      WorkspaceModel.find().lean(),
      UserModel.find().select("_id workspaceIds workspaceId").lean(),
      SubscriptionModel.find().lean(),
      ActivityLogModel.aggregate([
        { $match: { organizationId: { $exists: true, $ne: null } } },
        { $group: { _id: "$organizationId", lastActivity: { $max: "$occurredAt" } } },
      ]),
    ]);

    // Plans lookup map
    const plansMap = new Map<string, typeof allPlans[0]>();
    for (const p of allPlans) {
      plansMap.set(p._id.toString(), p);
    }

    // Default free plan document if any
    const freePlanDoc = allPlans.find((p) => p.price === 0);

    // Latest activity map
    const lastActivityMap = new Map<string, string>();
    for (const l of latestLogs) {
      if (l._id) lastActivityMap.set(l._id.toString(), new Date(l.lastActivity).toISOString());
    }

    // Workspaces per org
    const orgWorkspacesMap = new Map<string, string[]>();
    const wsToOrgMap = new Map<string, string>();
    for (const w of allWorkspaces) {
      const oId = w.organizationId?.toString();
      if (oId) {
        if (!orgWorkspacesMap.has(oId)) orgWorkspacesMap.set(oId, []);
        orgWorkspacesMap.get(oId)!.push(w._id.toString());
        wsToOrgMap.set(w._id.toString(), oId);
      }
    }

    // Members count per organization
    const orgMembersMap = new Map<string, number>();
    for (const u of allUsers) {
      const uWsIds: string[] = [
        ...(Array.isArray(u.workspaceIds) ? u.workspaceIds.map((id) => id?.toString()) : []),
        u.workspaceId?.toString(),
      ].filter((id): id is string => Boolean(id));

      const orgsForUser = new Set<string>();
      for (const wId of uWsIds) {
        const oId = wsToOrgMap.get(wId);
        if (oId) orgsForUser.add(oId);
      }

      for (const oId of orgsForUser) {
        orgMembersMap.set(oId, (orgMembersMap.get(oId) || 0) + 1);
      }
    }

    // 2. Build enriched items
    const enrichedList: EnrichedOrganizationItem[] = allOrganizations.map((org) => {
      const orgIdStr = org._id.toString();
      const rawPlanId = org.planId || "free";

      let planName: string;
      let planPrice = 0;
      let planMissing = false;
      let maxWorkspaces: number;

      if (rawPlanId === "free") {
        planName = freePlanDoc?.subscriptionName || "Free";
        planPrice = 0;
        maxWorkspaces = freePlanDoc?.maxWorkspaces || 2;
      } else if (plansMap.has(rawPlanId)) {
        const p = plansMap.get(rawPlanId)!;
        planName = p.subscriptionName;
        planPrice = p.price;
        maxWorkspaces = p.maxWorkspaces || 2;
      } else {
        // Plan referenced by ObjectId does NOT exist in subscriptions collection!
        planName = "Unknown plan";
        planMissing = true;
        maxWorkspaces = 2;
      }

      const wsCount = (orgWorkspacesMap.get(orgIdStr) || []).length;
      const memCount = orgMembersMap.get(orgIdStr) || 0;
      const memberLimit = maxWorkspaces * 25; // 25 members per workspace capacity

      // Near limit: 80% or more of workspace or member capacity
      const nearLimit =
        wsCount >= Math.floor(maxWorkspaces * 0.8) ||
        memCount >= Math.floor(memberLimit * 0.8);

      const lastActivity =
        lastActivityMap.get(orgIdStr) ||
        (org.updatedAt ? new Date(org.updatedAt).toISOString() : new Date(org.createdAt).toISOString());

      return {
        _id: orgIdStr,
        companyName: org.companyName,
        slug: org.slug,
        ownerName: org.ownerName,
        ownerEmail: org.ownerEmail,
        status: org.status || "active",
        planId: rawPlanId,
        planName,
        planPrice,
        planMissing,
        workspacesCount: wsCount,
        membersCount: memCount,
        memberLimit,
        nearLimit,
        lastActivity,
        createdAt: new Date(org.createdAt).toISOString(),
        updatedAt: org.updatedAt ? new Date(org.updatedAt).toISOString() : new Date(org.createdAt).toISOString(),
      };
    });

    const totalAll = enrichedList.length;
    const activeCount = enrichedList.filter((o) => o.status === "active").length;

    // 3. Apply Filters
    const filtered = enrichedList.filter((item) => {
      // Search
      if (searchQuery) {
        const matchName = item.companyName.toLowerCase().includes(searchQuery);
        const matchSlug = item.slug.toLowerCase().includes(searchQuery);
        const matchOwnerName = item.ownerName.toLowerCase().includes(searchQuery);
        const matchOwnerEmail = item.ownerEmail.toLowerCase().includes(searchQuery);
        if (!matchName && !matchSlug && !matchOwnerName && !matchOwnerEmail) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter && statusFilter !== "all") {
        if (item.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // Plan Filter
      if (planFilter && planFilter !== "all") {
        const matchesPlanId = item.planId === planFilter;
        const matchesPlanName = item.planName.toLowerCase() === planFilter.toLowerCase();
        if (!matchesPlanId && !matchesPlanName) return false;
      }

      // Near Limit Filter
      if (nearLimitFilter) {
        if (!item.nearLimit) return false;
      }

      return true;
    });

    // 4. Sort
    filtered.sort((a, b) => {
      switch (sortField) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name":
          return a.companyName.localeCompare(b.companyName);
        case "members":
          return b.membersCount - a.membersCount;
        case "lastActivity":
          return (
            new Date(b.lastActivity || 0).getTime() -
            new Date(a.lastActivity || 0).getTime()
          );
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    const availablePlans = allPlans.map((p) => ({
      id: p._id.toString(),
      name: p.subscriptionName,
      price: p.price,
    }));

    return {
      organizations: paginated,
      total,
      activeCount,
      totalAll,
      plans: availablePlans,
    };
  }

  async getOrganizationById(
    id: string
  ): Promise<OrganizationDetailResponseDTO | null> {
    const org = await OrganizationModel.findById(id).lean();
    if (!org) return null;

    const orgIdStr = org._id.toString();
    const rawPlanId = org.planId || "free";

    // 1. Resolve Plan
    const [allPlans, workspaces, , thirtyDaysAgoMeetings, activityLogs] =
      await Promise.all([
        SubscriptionModel.find().lean(),
        WorkspaceModel.find({ organizationId: org._id }).lean(),
        UserModel.find({
          $or: [
            { email: org.ownerEmail },
            { workspaceIds: { $in: [org._id] } },
          ],
        }).lean(),
        MeetingModel.find({
          startTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          status: { $in: ["completed", "live"] },
        }).lean(),
        ActivityLogModel.find({ organizationId: orgIdStr })
          .sort({ occurredAt: -1 })
          .limit(10)
          .lean(),
      ]);

    const planDoc =
      allPlans.find((p) => p._id.toString() === rawPlanId) ||
      allPlans.find((p) => p.price === 0) ||
      null;

    const planName = planDoc?.subscriptionName || (rawPlanId === "free" ? "Free" : "Unknown plan");
    const planPrice = planDoc?.price || 0;
    const planMissing = rawPlanId !== "free" && !allPlans.some((p) => p._id.toString() === rawPlanId);
    const maxWorkspaces = planDoc?.maxWorkspaces || 2;
    const maxRooms = planDoc?.maxRooms || 10;
    const features = planDoc?.features || [];

    // 2. Owner user
    const ownerUser = await UserModel.findOne({
      $or: [{ email: org.ownerEmail }, { role: "organization-owner" }],
    })
      .select("_id username email role status")
      .lean();

    // 3. Workspaces summary & Rooms
    const wsIds = workspaces.map((w) => w._id.toString());
    const [allOrgRooms, membersAssigned] = await Promise.all([
      RoomModel.find({ workspaceId: { $in: wsIds } }).lean(),
      UserModel.find({
        $or: [
          { workspaceIds: { $in: wsIds } },
          { workspaceId: { $in: wsIds } },
        ],
      }).lean(),
    ]);

    const enrichedWorkspaces = workspaces.map((w) => {
      const wIdStr = w._id.toString();
      const wsRoomsCount = allOrgRooms.filter((r) => r.workspaceId?.toString() === wIdStr).length;
      const wsMembersCount = membersAssigned.filter((m) => {
        const arr = Array.isArray(m.workspaceIds) ? m.workspaceIds.map((id) => id?.toString()) : [];
        return arr.includes(wIdStr) || m.workspaceId?.toString() === wIdStr;
      }).length;

      return {
        _id: wIdStr,
        workspaceName: w.workspaceName,
        status: w.status,
        membersCount: wsMembersCount,
        roomsCount: wsRoomsCount,
        createdAt: new Date(w.createdAt).toISOString(),
      };
    });

    // 4. Online count & 30d Meetings
    let onlineNow = 0;
    for (const m of membersAssigned) {
      if (socketService.isUserOnline(m._id.toString())) onlineNow++;
    }

    const orgMeetings30d = thirtyDaysAgoMeetings.filter((m) =>
      wsIds.includes(m.workspaceId.toString())
    );

    let meetingMinutes30d = 0;
    for (const m of orgMeetings30d) {
      if (m.startTime && m.endTime) {
        meetingMinutes30d += Math.max(
          0,
          Math.round((new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 60000)
        );
      }
    }

    const memberLimit = maxWorkspaces * 25;
    const nearLimit =
      workspaces.length >= Math.floor(maxWorkspaces * 0.8) ||
      membersAssigned.length >= Math.floor(memberLimit * 0.8);

    const recentActivities = activityLogs.map((log) => ({
      id: log._id.toString(),
      action: log.action,
      details: typeof log.metadata?.details === "string" ? log.metadata.details : log.action,
      actorName: log.actorRole || "System",
      timestamp: new Date(log.occurredAt).toISOString(),
    }));

    return {
      organization: {
        _id: orgIdStr,
        companyName: org.companyName,
        slug: org.slug,
        ownerName: org.ownerName,
        ownerEmail: org.ownerEmail,
        status: org.status || "active",
        planId: rawPlanId,
        planName,
        planPrice,
        planMissing,
        workspacesCount: workspaces.length,
        membersCount: membersAssigned.length,
        memberLimit,
        nearLimit,
        maxWorkspaces,
        maxRooms,
        features,
        lastActivity: recentActivities[0]?.timestamp || new Date(org.updatedAt || org.createdAt).toISOString(),
        createdAt: new Date(org.createdAt).toISOString(),
        updatedAt: new Date(org.updatedAt || org.createdAt).toISOString(),
      },
      owner: ownerUser
        ? {
            _id: ownerUser._id.toString(),
            username: ownerUser.username,
            email: ownerUser.email,
            role: ownerUser.role || "organization-owner",
            status: ownerUser.status !== false,
          }
        : null,
      kpis: {
        workspacesCount: workspaces.length,
        membersCount: membersAssigned.length,
        memberLimit,
        onlineNow,
        meetings30d: orgMeetings30d.length,
        meetingMinutes30d,
        formattedMeetingDuration: formatDuration(meetingMinutes30d),
      },
      workspaces: enrichedWorkspaces,
      subscription: {
        planId: rawPlanId,
        planName,
        price: planPrice,
        status: org.status === "active" ? "Active" : "Suspended",
        maxWorkspaces,
        features,
        renewalDate: null,
      },
      recentActivities,
    };
  }

  async updateOrganizationStatus(
    id: string,
    status: "active" | "suspended" | "archived",
    actorId: string,
    reason?: string
  ): Promise<void> {
    const org = await OrganizationModel.findById(id);
    if (!org) throw new Error("Organization not found");

    const prevStatus = org.status;
    org.status = status;
    await org.save();

    await ActivityLogModel.create({
      occurredAt: new Date(),
      action:
        status === "suspended"
          ? "ORGANIZATION_SUSPENDED"
          : status === "archived"
          ? "ORGANIZATION_ARCHIVED"
          : "ORGANIZATION_REACTIVATED",
      actorId: actorId || null,
      actorRole: "superadmin",
      organizationId: id,
      targetType: "ORGANIZATION",
      targetId: id,
      metadata: {
        companyName: org.companyName,
        previousStatus: prevStatus,
        newStatus: status,
        reason: reason || "Administrative action by Super Admin",
      },
    });
  }

  async updateOrganizationPlan(
    id: string,
    planId: string,
    actorId: string
  ): Promise<void> {
    const org = await OrganizationModel.findById(id);
    if (!org) throw new Error("Organization not found");

    const prevPlanId = org.planId;
    org.planId = planId;
    await org.save();

    await ActivityLogModel.create({
      occurredAt: new Date(),
      action: "ORGANIZATION_PLAN_CHANGED",
      actorId: actorId || null,
      actorRole: "superadmin",
      organizationId: id,
      targetType: "ORGANIZATION",
      targetId: id,
      metadata: {
        companyName: org.companyName,
        previousPlanId: prevPlanId,
        newPlanId: planId,
      },
    });
  }

  async updateOrganizationDetails(
    id: string,
    data: { companyName?: string; slug?: string; ownerName?: string; ownerEmail?: string },
    actorId: string
  ): Promise<void> {
    const org = await OrganizationModel.findById(id);
    if (!org) throw new Error("Organization not found");

    const before = {
      companyName: org.companyName,
      slug: org.slug,
      ownerName: org.ownerName,
      ownerEmail: org.ownerEmail,
    };

    if (data.companyName) org.companyName = data.companyName;
    if (data.slug) org.slug = data.slug;
    if (data.ownerName) org.ownerName = data.ownerName;
    if (data.ownerEmail) org.ownerEmail = data.ownerEmail;

    await org.save();

    await ActivityLogModel.create({
      occurredAt: new Date(),
      action: "ORGANIZATION_UPDATED",
      actorId: actorId || null,
      actorRole: "superadmin",
      organizationId: id,
      targetType: "ORGANIZATION",
      targetId: id,
      metadata: {
        before,
        after: data,
      },
    });
  }

  async archiveOrganization(id: string, actorId: string): Promise<void> {
    await this.updateOrganizationStatus(id, "archived", actorId, "Soft deleted by Super Admin");
  }
}
