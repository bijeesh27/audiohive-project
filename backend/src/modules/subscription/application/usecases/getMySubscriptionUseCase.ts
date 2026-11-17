import { Types } from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import {
  MetricLimitUsage,
  MySubscriptionResponseDTO,
} from "../dto/subcriptionDTOs";
import { OrganizationModel } from "../../../organization/infrastructure/organizationSchema";
import { WorkspaceModel } from "../../../workspace/infrastructure/workspaceSchema";
import { SubscriptionModel } from "../../infrastructure/subscriptionSchema";
import { SharedMetricsService } from "../../../../shared/metrics/sharedMetricsService";
import { AppError } from "../../../../common/Errors/AppError";
import { HttpStatus } from "../../../../common/constant/httpStatus";
import { MESSAGES } from "../../../../common/constant/messages";

export class GetMySubscriptionUseCase
  implements IuseCase<{ ownerEmail: string }, MySubscriptionResponseDTO>
{
  async execute(input: { ownerEmail: string }): Promise<MySubscriptionResponseDTO> {
    const org = await OrganizationModel.findOne({ ownerEmail: input.ownerEmail });
    if (!org) {
      throw new AppError(MESSAGES.ERRORS.ORANIZATION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const orgIdStr = org._id.toString();

    // Workspaces for this organization
    const workspaces = await WorkspaceModel.find({ organizationId: org._id })
      .sort({ createdAt: -1 })
      .lean();

    const workspaceIdStrings = workspaces.map((w) => w._id.toString());

    // Unified metrics via SharedMetricsService
    const [membersMetrics, roomsMetrics] = await Promise.all([
      SharedMetricsService.getMembersMetrics(
        workspaceIdStrings,
        workspaces.map((w) => ({ _id: w._id, workspaceName: w.workspaceName, status: w.status }))
      ),
      SharedMetricsService.getRoomsMetrics(workspaceIdStrings),
    ]);

    // Current Plan
    let plan = null;
    if (org.planId && org.planId !== "free" && Types.ObjectId.isValid(org.planId)) {
      plan = await SubscriptionModel.findById(org.planId).lean();
    }
    if (!plan) {
      plan =
        (await SubscriptionModel.findOne({ price: 0 }).lean()) ||
        (await SubscriptionModel.findOne({}).lean());
    }

    const calcMetric = (
      current: number,
      limit: number | null | undefined
    ): MetricLimitUsage => {
      if (!limit || limit <= 0) {
        return { current, limit: null, percent: 0, isUnlimited: true, status: "normal" };
      }
      const percent = Math.min(100, Math.round((current / limit) * 100));
      const status: "normal" | "warning" | "exceeded" =
        current >= limit ? "exceeded" : percent >= 80 ? "warning" : "normal";
      return { current, limit, percent, isUnlimited: false, status };
    };

    const maxWorkspacesLimit = plan?.maxWorkspaces ?? 2;
    const maxRoomsLimit = plan?.maxRooms ?? 10;
    // maxUsers is not in current plan schema, so treated as unlimited
    const maxUsersLimit = (plan as unknown as { maxUsers?: number })?.maxUsers ?? null;

    const usage = {
      workspaces: calcMetric(workspaces.length, maxWorkspacesLimit),
      rooms: calcMetric(roomsMetrics.totalRooms, maxRoomsLimit),
      members: calcMetric(membersMetrics.totalMembers, maxUsersLimit),
    };

    // All available active plans
    const availablePlans = await SubscriptionModel.find({ isActive: true })
      .sort({ price: 1 })
      .lean();

    const formattedCurrentPlan = {
      _id: plan ? plan._id.toString() : "free",
      subscriptionName: plan?.subscriptionName || "Free",
      price: plan?.price || 0,
      description: plan?.description || "Basic access",
      maxWorkspaces: plan?.maxWorkspaces || 2,
      maxRooms: plan?.maxRooms || 10,
      features: plan?.features || [],
      isActive: plan?.isActive !== false,
      stripePriceId: plan?.stripePriceId,
    };

    const formattedAvailablePlans = availablePlans.map((p) => ({
      _id: p._id.toString(),
      subscriptionName: p.subscriptionName,
      price: p.price,
      description: p.description,
      maxWorkspaces: p.maxWorkspaces,
      maxRooms: p.maxRooms || 10,
      features: p.features || [],
      isActive: p.isActive !== false,
      stripePriceId: p.stripePriceId,
    }));

    return {
      organization: {
        id: orgIdStr,
        companyName: org.companyName,
        ownerName: org.ownerName,
        ownerEmail: org.ownerEmail,
        status: org.status,
        planId: org.planId || "free",
        createdAt: org.createdAt ? org.createdAt.toISOString() : new Date().toISOString(),
      },
      currentPlan: formattedCurrentPlan,
      usage,
      availablePlans: formattedAvailablePlans,
    };
  }
}
