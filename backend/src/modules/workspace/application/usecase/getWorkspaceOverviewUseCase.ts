import { Types } from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { MESSAGES } from "../../../../common/constant/messages";
import { WorkspaceOverviewDTO } from "../dto/workspaceDTOs";
import { SharedMetricsService, buildMultiWorkspaceMembershipQuery } from "../../../../shared/metrics/sharedMetricsService";
import { SubscriptionModel } from "../../../subscription/infrastructure/subscriptionSchema";
import { UserModel } from "../../../../shared/User.utils/userSchema";
import { RoomModel } from "../../../room/infrastructure/roomSchema";
import { MeetingModel } from "../../../meeting/infrastructure/meetingSchema";
import { ActivityLogModel } from "../../../activityLog/infrastructure/activitylogSchema";
import { socketService } from "../../../../socket/socketService";
import { WORKSPACE_MEMBER_ROLES } from "../../../../shared/User.utils/workspaceMembership";

export interface GetWorkspaceOverviewInput {
  workspaceId: string;
  ownerEmail: string;
  days?: number;
}

export class GetWorkspaceOverviewUseCase implements IuseCase<GetWorkspaceOverviewInput, WorkspaceOverviewDTO> {
  constructor(
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly organizationRepository: IorganizaionRepository
  ) {}

  async execute(input: GetWorkspaceOverviewInput): Promise<WorkspaceOverviewDTO> {
    const { workspaceId, ownerEmail, days = 30 } = input;

    const [organization, workspace] = await Promise.all([
      this.organizationRepository.findByOwnerEmail(ownerEmail),
      this.workspaceRepository.getWorkspaceById(workspaceId),
    ]);

    if (!organization || !workspace || workspace.organizationId.toString() !== organization._id.toString()) {
      throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, 403);
    }

    const wsIdStr = workspace._id.toString();
    const wsIdObj = Types.ObjectId.isValid(wsIdStr) ? new Types.ObjectId(wsIdStr) : workspace._id;
    const wsIds = [wsIdStr, wsIdObj];

    // 1. Plan limits
    let plan = null;
    if (organization.planId && organization.planId !== "free" && Types.ObjectId.isValid(organization.planId)) {
      plan = await SubscriptionModel.findById(organization.planId).lean();
    }
    if (!plan) {
      plan = (await SubscriptionModel.findOne({ price: 0 }).lean()) || (await SubscriptionModel.findOne({}).lean());
    }

    const maxWorkspacesLimit = plan?.maxWorkspaces ?? 5;
    const maxRoomsLimit = plan?.maxRooms ?? 10;
    const maxUsersLimit = (plan as unknown as { maxUsers?: number })?.maxUsers ?? null;

    // 2. Members & Online Now
    const memberFilter = {
      ...buildMultiWorkspaceMembershipQuery([workspace._id]),
      role: { $in: WORKSPACE_MEMBER_ROLES },
    };
    const memberUsers = await UserModel.find(memberFilter).select("_id email username role status").lean();
    const membersCount = memberUsers.length;

    let onlineNow = 0;
    for (const u of memberUsers) {
      if (socketService.isUserOnline(u._id.toString())) {
        onlineNow++;
      }
    }

    // 3. Active Rooms
    const roomsCount = await RoomModel.countDocuments({
      workspaceId: { $in: wsIds },
      status: "active",
    });

    // 4. Meetings & Total Duration (last 30 days)
    const now = new Date();
    const start30d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const meetingsMetrics = await SharedMetricsService.getMeetingsMetrics(
      [wsIdStr],
      start30d,
      now
    );

    // 5. Admin Lookup
    let adminName: string | undefined = undefined;
    let adminEmail: string | undefined = workspace.workspaceAdminEmail || undefined;

    if (adminEmail) {
      const adminUser = await UserModel.findOne({ email: adminEmail }).select("username email").lean();
      if (adminUser) {
        adminName = adminUser.username;
      }
    }

    if (!adminName) {
      const fallbackAdmin = memberUsers.find(
        (u) => u.role === "workspaceadmin" || u.role === "workspace-admin"
      );
      if (fallbackAdmin) {
        adminName = fallbackAdmin.username;
        adminEmail = fallbackAdmin.email;
      }
    }

    // 6. Mini Activity Chart Series (Daily buckets)
    const dateList: string[] = [];
    const chartMap = new Map<string, { actions: number; meetings: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const isoKey = d.toISOString().split("T")[0];
      dateList.push(isoKey);
      chartMap.set(isoKey, { actions: 0, meetings: 0 });
    }

    const [activityLogs, meetingsList] = await Promise.all([
      ActivityLogModel.find({
        workspaceId: { $in: [wsIdStr, workspace._id] },
        occurredAt: { $gte: start30d },
      }).select("occurredAt").lean(),
      MeetingModel.find({
        workspaceId: { $in: wsIds },
        createdAt: { $gte: start30d },
        status: { $in: ["completed", "live"] },
      }).select("createdAt").lean(),
    ]);

    for (const log of activityLogs) {
      if (log.occurredAt) {
        const key = new Date(log.occurredAt).toISOString().split("T")[0];
        const entry = chartMap.get(key);
        if (entry) entry.actions++;
      }
    }

    for (const m of meetingsList) {
      if (m.createdAt) {
        const key = new Date(m.createdAt).toISOString().split("T")[0];
        const entry = chartMap.get(key);
        if (entry) entry.meetings++;
      }
    }

    const activityChart = dateList.map((date) => {
      const data = chartMap.get(date) || { actions: 0, meetings: 0 };
      return {
        date,
        label: date.slice(5),
        actions: data.actions,
        meetings: data.meetings,
      };
    });

    // 7. Recent 5 activities
    const recentLogs = await ActivityLogModel.find({
      workspaceId: { $in: [wsIdStr, workspace._id] },
    })
      .sort({ occurredAt: -1 })
      .limit(5)
      .lean();

    const actorIds = recentLogs.map((l) => l.actorId).filter(Boolean) as string[];
    const actorUsers = actorIds.length > 0
      ? await UserModel.find({ _id: { $in: actorIds } }).select("_id username email").lean()
      : [];
    const actorNameMap = new Map(actorUsers.map((a) => [a._id.toString(), a.username]));

    const recentActivities = recentLogs.map((log) => ({
      _id: log._id.toString(),
      action: log.action,
      actorName: (log.actorId && actorNameMap.get(log.actorId.toString())) || log.actorRole || "System",
      occurredAt: log.occurredAt ? new Date(log.occurredAt).toISOString() : new Date().toISOString(),
      details: (log.metadata?.details as string) || (log.metadata?.workspaceName as string) || undefined,
    }));

    const statsObj = {
      membersCount,
      membersLimit: maxUsersLimit,
      roomsCount,
      roomsLimit: maxRoomsLimit,
      onlineNow,
      meetingsCount30d: meetingsMetrics.meetingsConducted,
      meetingDuration30d: meetingsMetrics.formattedDuration,
    };

    const metricsObj = {
      membersCount,
      membersLimit: maxUsersLimit,
      roomsCount,
      roomsLimit: maxRoomsLimit,
      onlineNow,
      meetingsCount: meetingsMetrics.meetingsConducted,
      totalMeetingDurationMinutes: meetingsMetrics.totalDurationMinutes,
      meetingDurationFormatted: meetingsMetrics.formattedDuration,
      periodDays: days,
    };

    const planLimitsObj = {
      planName: plan?.subscriptionName || "Free Plan",
      maxUsers: maxUsersLimit,
      maxRooms: maxRoomsLimit,
      maxWorkspaces: maxWorkspacesLimit,
    };

    const planUsageObj = {
      planName: plan?.subscriptionName || "Free Plan",
      members: {
        current: membersCount,
        max: maxUsersLimit,
        percentage: maxUsersLimit ? Math.round((membersCount / maxUsersLimit) * 100) : 0,
      },
      rooms: {
        current: roomsCount,
        max: maxRoomsLimit,
        percentage: maxRoomsLimit ? Math.round((roomsCount / maxRoomsLimit) * 100) : 0,
      },
    };

    return {
      workspace: {
        _id: wsIdStr,
        workspaceName: workspace.workspaceName,
        slug: workspace.slug,
        status: workspace.status,
        organizationId: workspace.organizationId.toString(),
        workspaceAdminEmail: adminEmail,
        workspaceAdminName: adminName,
        description: workspace.companyProfile?.about || "",
        createdAt: workspace.createdAt ? new Date(workspace.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: workspace.updatedAt ? new Date(workspace.updatedAt).toISOString() : new Date().toISOString(),
      },
      stats: statsObj,
      metrics: metricsObj,
      planLimits: planLimitsObj,
      planUsage: planUsageObj,
      activityChart,
      recentActivities,
    };
  }
}
