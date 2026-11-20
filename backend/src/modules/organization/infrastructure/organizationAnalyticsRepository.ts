import { Types } from "mongoose";
import { IOrganizationAnalyticsRepository } from "../domain/IorganizationAnalyticsRepository";
import {
  GetOrganizationAnalyticsInputDTO,
  OrganizationAnalyticsResponseDTO,
  WorkspaceMemberDistributionItem,
  MostActiveWorkspaceItem,
  OrganizationActivityTrendPoint,
  EnrichedRecentActivity,
} from "../application/dto/organizationAnalyticsDTO";
import { OrganizationModel } from "./organizationSchema";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema";
import { UserModel } from "../../../shared/User.utils/userSchema";
import { MeetingModel } from "../../meeting/infrastructure/meetingSchema";
import { ActivityLogModel } from "../../activityLog/infrastructure/activitylogSchema";
import { parseDateRange } from "../../../shared/utils/dateRangeHelper";
import { AppError } from "../../../common/Errors/AppError";
import { HttpStatus } from "../../../common/constant/httpStatus";
import { MESSAGES } from "../../../common/constant/messages";
import { SharedMetricsService } from "../../../shared/metrics/sharedMetricsService";

export class OrganizationAnalyticsRepository implements IOrganizationAnalyticsRepository {
  async getOrganizationAnalytics(
    input: GetOrganizationAnalyticsInputDTO
  ): Promise<OrganizationAnalyticsResponseDTO> {
    const org = await OrganizationModel.findOne({ ownerEmail: input.ownerEmail });
    if (!org) {
      throw new AppError(MESSAGES.ERRORS.ORANIZATION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const orgId = org._id.toString();
    const { start, end, rangeType, buckets } = parseDateRange(
      input.range,
      input.startDate,
      input.endDate
    );

    // 1. Fetch Workspaces for this Organization
    const workspaces = await WorkspaceModel.find({ organizationId: org._id }).lean();
    const workspaceIdStrings = workspaces.map((w) => w._id.toString());

    const workspacesSummary = {
      total: workspaces.length,
      active: workspaces.filter((w) => w.status === "active").length,
      inactive: workspaces.filter((w) => w.status === "archived").length,
      suspended: workspaces.filter((w) => w.status === "suspended").length,
      pending: 0,
    };

    // 2. Members & Distribution via Unified SharedMetricsService
    const membersMetrics = await SharedMetricsService.getMembersMetrics(
      workspaceIdStrings,
      workspaces.map((w) => ({ _id: w._id, workspaceName: w.workspaceName, status: w.status }))
    );

    const totalMembers = membersMetrics.totalMembers;
    const distribution: WorkspaceMemberDistributionItem[] = membersMetrics.distribution.map((d) => ({
      workspaceId: d.workspaceId,
      workspaceName: d.workspaceName,
      memberCount: d.memberCount,
      percentage: d.percentage,
      status: d.status as "active" | "suspended" | "archived",
    }));

    // 3. Meetings Summary via Unified SharedMetricsService
    const meetingsMetrics = await SharedMetricsService.getMeetingsMetrics(
      workspaceIdStrings,
      start,
      end
    );

    const meetingsSummary = {
      totalMeetings: meetingsMetrics.meetingsConducted,
      totalDurationMinutes: meetingsMetrics.totalDurationMinutes,
      completedMeetings: meetingsMetrics.completedMeetings,
      liveMeetings: meetingsMetrics.liveMeetings,
      scheduledMeetings: meetingsMetrics.scheduledMeetings,
      cancelledMeetings: meetingsMetrics.cancelledMeetings,
    };

    // 4. Rooms Summary via Unified SharedMetricsService
    const roomsMetrics = await SharedMetricsService.getRoomsMetrics(workspaceIdStrings);

    const roomsSummary = {
      totalRooms: roomsMetrics.totalRooms,
      activeRooms: roomsMetrics.activeRooms,
      blockedRooms: roomsMetrics.blockedRooms,
      publicRooms: roomsMetrics.publicRooms,
      privateRooms: roomsMetrics.privateRooms,
    };

    // 5. Activity Trends across time buckets
    const activitiesInRange = await ActivityLogModel.find({
      $or: [
        { organizationId: orgId },
        { workspaceId: { $in: workspaceIdStrings } },
      ],
      occurredAt: { $gte: start, $lte: end },
    })
      .select("occurredAt action workspaceId")
      .lean();

    const activityCountByDay = new Map<string, number>();
    for (const act of activitiesInRange) {
      const day = new Date(act.occurredAt).toISOString().slice(0, 10);
      activityCountByDay.set(day, (activityCountByDay.get(day) || 0) + 1);
    }

    const meetingsInRange = await MeetingModel.find({
      workspaceId: { $in: workspaceIdStrings.map((id) => new Types.ObjectId(id)) },
      createdAt: { $gte: start, $lte: end },
    }).select("createdAt").lean();

    const meetingCountByDay = new Map<string, number>();
    for (const m of meetingsInRange) {
      const day = new Date(m.createdAt).toISOString().slice(0, 10);
      meetingCountByDay.set(day, (meetingCountByDay.get(day) || 0) + 1);
    }

    const activityTrends: OrganizationActivityTrendPoint[] = buckets.map((b) => ({
      date: b.date,
      label: b.label,
      activitiesCount: activityCountByDay.get(b.date) || 0,
      meetingsCount: meetingCountByDay.get(b.date) || 0,
    }));

    // 6. Most Active Workspaces
    const workspaceActivityCounts = new Map<string, number>();
    for (const act of activitiesInRange) {
      if (act.workspaceId) {
        workspaceActivityCounts.set(
          act.workspaceId,
          (workspaceActivityCounts.get(act.workspaceId) || 0) + 1
        );
      }
    }

    const workspaceMeetingCounts = new Map<string, number>();
    for (const m of meetingsInRange) {
      const wIdStr = (m as { workspaceId?: Types.ObjectId }).workspaceId?.toString();
      if (wIdStr) {
        workspaceMeetingCounts.set(
          wIdStr,
          (workspaceMeetingCounts.get(wIdStr) || 0) + 1
        );
      }
    }

    const mostActiveWorkspaces: MostActiveWorkspaceItem[] = workspaces
      .map((w) => {
        const wIdStr = w._id.toString();
        const distItem = distribution.find((d) => d.workspaceId === wIdStr);
        return {
          workspaceId: wIdStr,
          workspaceName: w.workspaceName,
          totalActivities: workspaceActivityCounts.get(wIdStr) || 0,
          totalMeetings: workspaceMeetingCounts.get(wIdStr) || 0,
          totalMembers: distItem?.memberCount || 0,
          status: w.status,
        };
      })
      .sort((a, b) => b.totalActivities + b.totalMeetings - (a.totalActivities + a.totalMeetings))
      .slice(0, 5);

    // 7. Recent Organization Activities
    const recentLogs = await ActivityLogModel.find({
      $or: [
        { organizationId: orgId },
        { workspaceId: { $in: workspaceIdStrings } },
      ],
    })
      .sort({ occurredAt: -1 })
      .limit(10)
      .lean();

    const actorIds = Array.from(
      new Set(recentLogs.map((l) => l.actorId).filter(Boolean) as string[])
    );
    const actorUsers = actorIds.length > 0
      ? await UserModel.find({ _id: { $in: actorIds } }, { username: 1, email: 1 }).lean()
      : [];
    const actorMap = new Map<string, { username: string; email: string }>();
    actorUsers.forEach((u) => actorMap.set(u._id.toString(), { username: u.username, email: u.email }));

    const workspaceNameMap = new Map<string, string>();
    workspaces.forEach((w) => workspaceNameMap.set(w._id.toString(), w.workspaceName));

    const recentActivities: EnrichedRecentActivity[] = recentLogs.map((log) => {
      const user = log.actorId ? actorMap.get(log.actorId) : undefined;
      const workspaceName = log.workspaceId ? workspaceNameMap.get(log.workspaceId) : undefined;
      const actorName =
        user?.username ||
        (log.metadata?.ownerName as string) ||
        (log.metadata?.username as string) ||
        (log.actorRole ? log.actorRole.replace("-", " ") : "System");

      return {
        _id: log._id.toString(),
        action: log.action,
        actorName,
        actorEmail: user?.email || (log.metadata?.email as string) || undefined,
        actorRole: log.actorRole,
        workspaceName,
        targetType: log.targetType,
        occurredAt: log.occurredAt.toISOString(),
      };
    });

    return {
      organizationId: orgId,
      organizationName: org.companyName,
      ownerEmail: org.ownerEmail,
      dateRange: {
        range: rangeType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      workspacesSummary,
      membersSummary: {
        totalMembers,
        distribution,
      },
      meetingsSummary,
      roomsSummary,
      activityTrends,
      mostActiveWorkspaces,
      recentActivities,
    };
  }
}

