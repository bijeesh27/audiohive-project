import { Types } from "mongoose";
import { IWorkspaceUserAnalyticsRepository } from "../domain/IworkspaceUserAnalyticsRepository";
import {
  GetWorkspaceUserAnalyticsInputDTO,
  WorkspaceUserAnalyticsResponseDTO,
  UserActivityRecordItem,
  RecentlyJoinedMemberItem,
  WorkspaceUserActivityTrendPoint,
  UserRankItem,
  GetUserActivityHistoryInputDTO,
  UserActivityHistoryResponseDTO,
  UserActivityHistoryItem,
} from "../application/dtos/workspaceUserAnalyticsDTO";
import {
  GetWorkspaceDashboardInputDTO,
  WorkspaceDashboardResponseDTO,
  GetWorkspaceMembersActivityInputDTO,
  WorkspaceMembersActivityResponseDTO,
  WorkspaceMemberActivityRecordItem,
  LiveMemberItem,
  RecentlyJoinedItem,
  EngagementUserItem,
  RoomUsageItem,
  RecentActivityFeedItem,
} from "../application/dtos/workspaceDashboardDTO";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema";
import { OrganizationModel } from "../../organization/infrastructure/organizationSchema";
import { UserModel } from "../../../shared/User.utils/userSchema";
import { MeetingModel } from "../../meeting/infrastructure/meetingSchema";
import { RoomModel } from "../../room/infrastructure/roomSchema";
import { ActivityLogModel } from "../../activityLog/infrastructure/activitylogSchema";
import { socketService } from "../../../socket/socketService";
import { parseDateRange } from "../../../shared/utils/dateRangeHelper";
import { UserRoles } from "../../../common/constant/userRoles";
import { AppError } from "../../../common/Errors/AppError";
import { HttpStatus } from "../../../common/constant/httpStatus";
import { MESSAGES } from "../../../common/constant/messages";
import {
  buildWorkspaceMembershipQuery,
  buildWorkspaceMemberFilter,
} from "../../../shared/User.utils/workspaceMembership";
import { SharedMetricsService } from "../../../shared/metrics/sharedMetricsService";

const workspaceMembershipQuery = buildWorkspaceMembershipQuery;

const computeDelta = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) {
      return { current, previous, deltaPercent: 0, trend: "neutral" as const };
    }
    return { current, previous, deltaPercent: 100, trend: "up" as const };
  }
  const deltaPercent = Math.round(((current - previous) / previous) * 1000) / 10;
  const trend = deltaPercent > 0 ? ("up" as const) : deltaPercent < 0 ? ("down" as const) : ("neutral" as const);
  return { current, previous, deltaPercent, trend };
};

const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return "–";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

export class WorkspaceUserAnalyticsRepository
  implements IWorkspaceUserAnalyticsRepository
{
  async getWorkspaceDashboard(
    input: GetWorkspaceDashboardInputDTO
  ): Promise<WorkspaceDashboardResponseDTO> {
    if (!Types.ObjectId.isValid(input.workspaceId)) {
      throw new AppError(MESSAGES.ERRORS.WORKSPACE_INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const workspace = await WorkspaceModel.findById(input.workspaceId);
    if (!workspace) {
      throw new AppError(MESSAGES.ERRORS.WORKSPACE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const isWsAdmin = workspace.workspaceAdminEmail?.toLowerCase() === input.adminEmail.toLowerCase();
    let isOrgOwner = false;
    if (!isWsAdmin && workspace.organizationId) {
      const org = await OrganizationModel.findById(workspace.organizationId).select("ownerEmail").lean();
      isOrgOwner = org?.ownerEmail?.toLowerCase() === input.adminEmail.toLowerCase();
    }
    if (!isWsAdmin && !isOrgOwner) {
      throw new AppError(MESSAGES.ERRORS.ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }

    const workspaceObjId = new Types.ObjectId(input.workspaceId);
    const workspaceIdStr = input.workspaceId;

    // 1. Date range calculation (current and previous period of equal length)
    const { start, end, rangeType, buckets } = parseDateRange(
      input.range,
      input.startDate,
      input.endDate
    );
    const durationMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durationMs);
    const prevEnd = new Date(start.getTime());

    // 2. Fetch workspace members via Unified SharedMetricsService
    const membersMetrics = await SharedMetricsService.getMembersMetrics(
      [input.workspaceId],
      [{ _id: workspace._id, workspaceName: workspace.workspaceName, status: workspace.status }],
      prevEnd
    );

    const allMembers = membersMetrics.allMembers;
    const membersMap = new Map<string, { username: string; email: string }>();
    for (const m of allMembers) {
      membersMap.set(m._id, { username: m.username, email: m.email });
    }

    const totalMembers = membersMetrics.totalMembers;
    const onlineCount = membersMetrics.onlineCount;
    const offlineCount = membersMetrics.offlineCount;
    const totalMembersDelta = membersMetrics.membersDelta;

    // Find admin user for personalized greeting
    const adminUser = allMembers.find(
      (u) => u.email.toLowerCase() === input.adminEmail.toLowerCase()
    );
    const adminName = adminUser?.username || "Admin";

    // 3. ActivityLog aggregation using $facet pipeline
    const [activityAggResult] = await ActivityLogModel.aggregate([
      {
        $facet: {
          currentActions: [
            { $match: { workspaceId: workspaceIdStr, occurredAt: { $gte: start, $lte: end } } },
            { $count: "count" },
          ],
          currentLogins: [
            {
              $match: {
                workspaceId: workspaceIdStr,
                action: { $in: ["USER_LOGIN", "LOGIN"] },
                occurredAt: { $gte: start, $lte: end },
              },
            },
            { $count: "count" },
          ],
          prevActions: [
            { $match: { workspaceId: workspaceIdStr, occurredAt: { $gte: prevStart, $lt: start } } },
            { $count: "count" },
          ],
          prevLogins: [
            {
              $match: {
                workspaceId: workspaceIdStr,
                action: { $in: ["USER_LOGIN", "LOGIN"] },
                occurredAt: { $gte: prevStart, $lt: start },
              },
            },
            { $count: "count" },
          ],
          dailyTrends: [
            { $match: { workspaceId: workspaceIdStr, occurredAt: { $gte: start, $lte: end } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } },
                actions: { $sum: 1 },
                logins: {
                  $sum: { $cond: [{ $in: ["$action", ["USER_LOGIN", "LOGIN"]] }, 1, 0] },
                },
              },
            },
          ],
          userActivityAgg: [
            {
              $match: {
                workspaceId: workspaceIdStr,
                occurredAt: { $gte: start, $lte: end },
                actorId: { $ne: null },
              },
            },
            {
              $group: {
                _id: "$actorId",
                actionCount: { $sum: 1 },
                loginCount: {
                  $sum: { $cond: [{ $in: ["$action", ["USER_LOGIN", "LOGIN"]] }, 1, 0] },
                },
                lastActiveAt: { $max: "$occurredAt" },
              },
            },
          ],
          activeRoomsInRange: [
            {
              $match: {
                workspaceId: workspaceIdStr,
                occurredAt: { $gte: start, $lte: end },
                targetType: { $in: ["ROOM", "CALL"] },
              },
            },
            {
              $group: {
                _id: "$targetId",
                count: { $sum: 1 },
              },
            },
          ],
          prevActiveRooms: [
            {
              $match: {
                workspaceId: workspaceIdStr,
                occurredAt: { $gte: prevStart, $lt: start },
                targetType: { $in: ["ROOM", "CALL"] },
              },
            },
            {
              $group: {
                _id: "$targetId",
              },
            },
          ],
          recentLogs: [
            { $match: { workspaceId: workspaceIdStr } },
            { $sort: { occurredAt: -1 } },
            { $limit: 10 },
          ],
        },
      },
    ]);

    const totalActionsCurrent = activityAggResult?.currentActions?.[0]?.count || 0;
    const totalActionsPrev = activityAggResult?.prevActions?.[0]?.count || 0;
    const totalActionsDelta = computeDelta(totalActionsCurrent, totalActionsPrev);

    const totalLoginsCurrent = activityAggResult?.currentLogins?.[0]?.count || 0;
    const totalLoginsPrev = activityAggResult?.prevLogins?.[0]?.count || 0;
    const totalLoginsDelta = computeDelta(totalLoginsCurrent, totalLoginsPrev);

    // Chart series daily mapping
    const dailyMap = new Map<string, { actions: number; logins: number }>();
    if (activityAggResult?.dailyTrends) {
      for (const item of activityAggResult.dailyTrends) {
        dailyMap.set(item._id, { actions: item.actions || 0, logins: item.logins || 0 });
      }
    }

    const chartSeries = buckets.map((b) => {
      const counts = dailyMap.get(b.date) || { actions: 0, logins: 0 };
      return {
        date: b.date,
        label: b.label,
        actions: counts.actions,
        logins: counts.logins,
      };
    });

    // 4. Meetings aggregation
    // 4. Meetings aggregation via Unified SharedMetricsService
    const meetingsMetrics = await SharedMetricsService.getMeetingsMetrics(
      [input.workspaceId],
      start,
      end,
      prevStart,
      prevEnd
    );

    const meetingsHeldCurrent = meetingsMetrics.meetingsConducted;
    const totalMeetingMinutesCurrent = meetingsMetrics.totalDurationMinutes;
    const scheduledMeetings = meetingsMetrics.scheduledMeetings;
    const completedMeetings = meetingsMetrics.completedMeetings;
    const liveMeetings = meetingsMetrics.liveMeetings;
    const meetingsDelta = meetingsMetrics.meetingsDelta;
    const userMeetingsMap = meetingsMetrics.userMeetingsMap;

    const avgDurationMinutes = meetingsHeldCurrent > 0
      ? Math.round(totalMeetingMinutesCurrent / meetingsHeldCurrent)
      : 0;

    // 5. Rooms query via Unified SharedMetricsService
    const roomsMetrics = await SharedMetricsService.getRoomsMetrics([input.workspaceId], prevEnd);
    const totalRooms = roomsMetrics.totalRooms;
    const activeRoomsCount = roomsMetrics.activeRooms;
    const activeRoomsDelta = roomsMetrics.activeRoomsDelta;

    const workspaceRooms = await RoomModel.find({ workspaceId: workspaceObjId })
      .select("_id name type allowedUsers")
      .lean();

    // Room Usage list
    const roomActivityMap = new Map<string, number>();
    if (activityAggResult?.activeRoomsInRange) {
      for (const r of activityAggResult.activeRoomsInRange) {
        if (r._id) roomActivityMap.set(String(r._id), r.count || 0);
      }
    }

    const topRooms: RoomUsageItem[] = workspaceRooms.map((r) => {
      const rId = r._id.toString();
      const count = roomActivityMap.get(rId) || 0;
      const participantsCount = Array.isArray(r.allowedUsers) ? r.allowedUsers.length : 0;
      return {
        roomId: rId,
        name: r.name,
        type: r.type,
        activityCount: count,
        participantsCount,
        timeSpentMinutes: count * 15, // estimated time spent from actions
      };
    })
      .sort((a, b) => b.activityCount - a.activityCount);

    // 6. Live Now & Recently Joined
    const roomNameMap = new Map<string, string>();
    for (const r of workspaceRooms) {
      roomNameMap.set(r._id.toString(), r.name);
    }

    const liveNow: LiveMemberItem[] = [];
    for (const u of allMembers) {
      const uId = u._id.toString();
      if (socketService.isUserOnline(uId)) {
        const currentRoomId = socketService.getUserCurrentRoom(uId);
        const roomName = currentRoomId ? roomNameMap.get(currentRoomId) || "Active Room" : undefined;
        liveNow.push({
          userId: uId,
          username: u.username,
          email: u.email,
          isOnline: true,
          currentRoom: currentRoomId ? { roomId: currentRoomId, name: roomName || "Call Room" } : null,
          joinedAt: (u as { createdAt?: Date }).createdAt
            ? new Date((u as { createdAt?: Date }).createdAt!).toISOString()
            : new Date().toISOString(),
        });
      }
    }

    const recentlyJoined: RecentlyJoinedItem[] = allMembers.slice(0, 5).map((u) => {
      const uId = u._id.toString();
      return {
        userId: uId,
        username: u.username,
        email: u.email,
        role: u.role || UserRoles.MEMBER,
        isOnline: socketService.isUserOnline(uId),
        joinedAt: (u as { createdAt?: Date }).createdAt
          ? new Date((u as { createdAt?: Date }).createdAt!).toISOString()
          : new Date().toISOString(),
      };
    });

    // 7. Engagement Leaderboard (Most Active vs Needs Engagement - strictly mutually exclusive)
    const userAggMap = new Map<string, { actionCount: number; loginCount: number; lastActiveAt: Date | null }>();
    if (activityAggResult?.userActivityAgg) {
      for (const item of activityAggResult.userActivityAgg) {
        userAggMap.set(String(item._id), {
          actionCount: item.actionCount || 0,
          loginCount: item.loginCount || 0,
          lastActiveAt: item.lastActiveAt ? new Date(item.lastActiveAt) : null,
        });
      }
    }

    const memberEngagementList = allMembers.map((u) => {
      const uId = u._id.toString();
      const stats = userAggMap.get(uId);
      const actionCount = stats?.actionCount || 0;
      const logins = stats?.loginCount || 0;
      const meetingsCount = userMeetingsMap.get(uId) || 0;
      const score = actionCount * 1 + logins * 2 + meetingsCount * 5;
      const lastActiveAt = stats?.lastActiveAt || (u as { updatedAt?: Date }).updatedAt || null;

      return {
        userId: uId,
        username: u.username,
        email: u.email,
        isOnline: socketService.isUserOnline(uId),
        score,
        actionCount,
        meetingsCount,
        lastActiveAt: lastActiveAt ? new Date(lastActiveAt).toISOString() : null,
        progressPercent: 0,
      };
    });

    const maxScore = Math.max(...memberEngagementList.map((m) => m.score), 1);
    memberEngagementList.forEach((m) => {
      m.progressPercent = Math.min(100, Math.round((m.score / maxScore) * 100));
    });

    // Sort descending for most active
    const sortedDesc = [...memberEngagementList].sort((a, b) => b.score - a.score);
    const mostActiveUsers = sortedDesc.slice(0, 5);
    const mostActiveIds = new Set(mostActiveUsers.map((u) => u.userId));

    // Needs Engagement: lowest scores, strictly NOT in mostActive
    const remainingForNeedsEngagement = memberEngagementList
      .filter((u) => !mostActiveIds.has(u.userId))
      .sort((a, b) => a.score - b.score);
    const needsEngagementUsers = remainingForNeedsEngagement.slice(0, 5);

    // 8. Recent Activities Feed
    const recentActivities: RecentActivityFeedItem[] = (activityAggResult?.recentLogs || []).map(
      (l: any) => {
        const actorIdStr = l.actorId ? String(l.actorId) : null;
        const memberInfo = actorIdStr ? membersMap.get(actorIdStr) : null;
        return {
          id: l._id ? String(l._id) : Math.random().toString(),
          action: l.action || "WORKSPACE_ACTION",
          actorId: actorIdStr,
          actorName: memberInfo?.username || l.metadata?.actorName || "Workspace Member",
          actorEmail: memberInfo?.email,
          targetType: l.targetType,
          targetId: l.targetId,
          occurredAt: l.occurredAt ? new Date(l.occurredAt).toISOString() : new Date().toISOString(),
          metadata: l.metadata,
        };
      }
    );

    return {
      workspaceId: input.workspaceId,
      workspaceName: workspace.workspaceName,
      adminName,
      dateRange: {
        range: rangeType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        prevStartDate: prevStart.toISOString(),
        prevEndDate: prevEnd.toISOString(),
      },
      kpis: {
        totalMembers: {
          ...totalMembersDelta,
          current: totalMembers,
        },
        onlineNow: {
          online: onlineCount,
          offline: offlineCount,
          total: totalMembers,
        },
        totalLogins: totalLoginsDelta,
        meetings: {
          ...meetingsDelta,
          meetingsHeld: meetingsHeldCurrent,
          totalMinutes: totalMeetingMinutesCurrent,
          formattedDuration: formatDuration(totalMeetingMinutesCurrent),
        },
        activeRooms: {
          ...activeRoomsDelta,
          activeRooms: activeRoomsCount,
          totalRooms,
        },
        totalActions: totalActionsDelta,
      },
      chartSeries,
      liveNow,
      recentlyJoined,
      leaderboard: {
        mostActive: mostActiveUsers,
        needsEngagement: needsEngagementUsers,
      },
      roomUsage: {
        topRooms,
        meetingsOverview: {
          scheduled: scheduledMeetings,
          completed: completedMeetings,
          live: liveMeetings,
          avgDurationMinutes,
          formattedAvgDuration: formatDuration(avgDurationMinutes),
        },
      },
      recentActivities,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getWorkspaceMembersActivity(
    input: GetWorkspaceMembersActivityInputDTO
  ): Promise<WorkspaceMembersActivityResponseDTO> {
    if (!Types.ObjectId.isValid(input.workspaceId)) {
      throw new AppError(MESSAGES.ERRORS.WORKSPACE_INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const workspace = await WorkspaceModel.findById(input.workspaceId);
    if (!workspace) {
      throw new AppError(MESSAGES.ERRORS.WORKSPACE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const isWsAdmin = workspace.workspaceAdminEmail?.toLowerCase() === input.adminEmail.toLowerCase();
    let isOrgOwner = false;
    if (!isWsAdmin && workspace.organizationId) {
      const org = await OrganizationModel.findById(workspace.organizationId).select("ownerEmail").lean();
      isOrgOwner = org?.ownerEmail?.toLowerCase() === input.adminEmail.toLowerCase();
    }
    if (!isWsAdmin && !isOrgOwner) {
      throw new AppError(MESSAGES.ERRORS.ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }

    const { start, end } = parseDateRange(input.range, input.startDate, input.endDate);
    const workspaceObjId = new Types.ObjectId(input.workspaceId);
    const workspaceIdStr = input.workspaceId;

    // 1. Fetch all members with optional search and status filter
    const memberFilter: Record<string, unknown> = {
      role: { $in: [UserRoles.MEMBER, UserRoles.WORKSPACE_ADMIN, "workspace-admin"] },
      ...workspaceMembershipQuery(input.workspaceId),
    };

    if (input.status === "active") {
      memberFilter.status = { $ne: false };
    } else if (input.status === "disabled") {
      memberFilter.status = false;
    }

    if (input.search && input.search.trim()) {
      const q = input.search.trim();
      memberFilter.$or = [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const members = await UserModel.find(memberFilter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch activity stats in date range
    const activities = await ActivityLogModel.find({
      workspaceId: workspaceIdStr,
      occurredAt: { $gte: start, $lte: end },
    })
      .select("actorId action occurredAt")
      .lean();

    const userActivityMap = new Map<string, number>();
    const userLoginMap = new Map<string, number>();
    const userLastActiveMap = new Map<string, Date>();
    const userLastLoginMap = new Map<string, Date>();

    for (const act of activities) {
      if (!act.actorId) continue;
      const aId = act.actorId;
      userActivityMap.set(aId, (userActivityMap.get(aId) || 0) + 1);

      if (!userLastActiveMap.has(aId) || new Date(act.occurredAt) > userLastActiveMap.get(aId)!) {
        userLastActiveMap.set(aId, new Date(act.occurredAt));
      }

      if (act.action === "USER_LOGIN" || act.action === "LOGIN") {
        userLoginMap.set(aId, (userLoginMap.get(aId) || 0) + 1);
        if (!userLastLoginMap.has(aId) || new Date(act.occurredAt) > userLastLoginMap.get(aId)!) {
          userLastLoginMap.set(aId, new Date(act.occurredAt));
        }
      }
    }

    // 3. Fetch meetings & duration via Unified SharedMetricsService
    const meetingsMetrics = await SharedMetricsService.getMeetingsMetrics(
      [input.workspaceId],
      start,
      end
    );

    const userMeetingsMap = meetingsMetrics.userMeetingsMap;
    const userMeetingDurationMap = meetingsMetrics.userMeetingDurationMap;

    // 4. Fetch rooms
    const workspaceRooms = await RoomModel.find({ workspaceId: workspaceObjId })
      .select("_id type allowedUsers")
      .lean();

    const userRoomsCountMap = new Map<string, number>();
    for (const u of members) {
      const uId = u._id.toString();
      const count = workspaceRooms.filter((r) => {
        if (r.type === "public") return true;
        return Array.isArray(r.allowedUsers) && r.allowedUsers.some((id: any) => id && id.toString() === uId);
      }).length;
      userRoomsCountMap.set(uId, count);
    }

    // 5. Build full items list
    let recordItems: WorkspaceMemberActivityRecordItem[] = members.map((u) => {
      const uId = u._id.toString();
      const lastActive = userLastActiveMap.get(uId) || (u as { updatedAt?: Date }).updatedAt || null;
      const lastLogin = userLastLoginMap.get(uId) || null;
      const durationMins = userMeetingDurationMap.get(uId) || 0;

      return {
        userId: uId,
        username: u.username,
        email: u.email,
        role: u.role || UserRoles.MEMBER,
        status: u.status !== false,
        isOnline: socketService.isUserOnline(uId),
        joinedAt: (u as { createdAt?: Date }).createdAt
          ? new Date((u as { createdAt?: Date }).createdAt!).toISOString()
          : new Date().toISOString(),
        lastActiveAt: lastActive ? new Date(lastActive).toISOString() : null,
        lastLoginAt: lastLogin ? new Date(lastLogin).toISOString() : null,
        totalLogins: userLoginMap.get(uId) || 0,
        meetingsAttended: userMeetingsMap.get(uId) || 0,
        meetingDurationMinutes: durationMins,
        formattedMeetingDuration: formatDuration(durationMins),
        roomsCount: userRoomsCountMap.get(uId) || 0,
        activityCount: userActivityMap.get(uId) || 0,
      };
    });

    // 6. Sorting
    const sortField = input.sortField || "actions";
    const sortOrder = input.sortOrder === "asc" ? 1 : -1;

    recordItems.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortField) {
        case "logins":
          valA = a.totalLogins;
          valB = b.totalLogins;
          break;
        case "meetings":
          valA = a.meetingsAttended;
          valB = b.meetingsAttended;
          break;
        case "duration":
          valA = a.meetingDurationMinutes;
          valB = b.meetingDurationMinutes;
          break;
        case "rooms":
          valA = a.roomsCount;
          valB = b.roomsCount;
          break;
        case "name":
          valA = a.username.toLowerCase();
          valB = b.username.toLowerCase();
          break;
        case "lastActive":
          valA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          valB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          break;
        case "actions":
        default:
          valA = a.activityCount;
          valB = b.activityCount;
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder * valA.localeCompare(valB);
      }
      return sortOrder * ((valA as number) - (valB as number));
    });

    // 7. Pagination
    const total = recordItems.length;
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = input.limit && input.limit > 0 ? input.limit : 10;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedItems = recordItems.slice((page - 1) * limit, page * limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getWorkspaceUserAnalytics(
    input: GetWorkspaceUserAnalyticsInputDTO
  ): Promise<WorkspaceUserAnalyticsResponseDTO> {
    if (!Types.ObjectId.isValid(input.workspaceId)) {
      throw new AppError(MESSAGES.ERRORS.WORKSPACE_INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const workspace = await WorkspaceModel.findById(input.workspaceId);
    if (!workspace) {
      throw new AppError(MESSAGES.ERRORS.WORKSPACE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const isWsAdmin = workspace.workspaceAdminEmail?.toLowerCase() === input.adminEmail.toLowerCase();
    let isOrgOwner = false;
    if (!isWsAdmin && workspace.organizationId) {
      const org = await OrganizationModel.findById(workspace.organizationId).select("ownerEmail").lean();
      isOrgOwner = org?.ownerEmail?.toLowerCase() === input.adminEmail.toLowerCase();
    }
    if (!isWsAdmin && !isOrgOwner) {
      throw new AppError(MESSAGES.ERRORS.ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }

    const { start, end, rangeType, buckets } = parseDateRange(
      input.range,
      input.startDate,
      input.endDate
    );

    const workspaceObjId = new Types.ObjectId(input.workspaceId);
    const workspaceIdStr = input.workspaceId;

    const baseMemberFilter = {
      role: { $in: [UserRoles.MEMBER, UserRoles.WORKSPACE_ADMIN, "workspace-admin"] },
      ...workspaceMembershipQuery(input.workspaceId),
    };

    const allMembers = await UserModel.find(baseMemberFilter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const totalMembers = allMembers.length;
    let onlineCount = 0;
    let offlineCount = 0;
    let activeCount = 0;
    let inactiveCount = 0;

    for (const u of allMembers) {
      const uId = u._id.toString();
      const online = socketService.isUserOnline(uId);
      if (online) onlineCount++;
      else offlineCount++;

      if (u.status !== false) activeCount++;
      else inactiveCount++;
    }

    const recentlyJoined: RecentlyJoinedMemberItem[] = allMembers.slice(0, 5).map((u) => {
      const uId = u._id.toString();
      return {
        userId: uId,
        username: u.username,
        email: u.email,
        role: u.role || UserRoles.MEMBER,
        isOnline: socketService.isUserOnline(uId),
        joinedAt: (u as { createdAt?: Date }).createdAt
          ? new Date((u as { createdAt?: Date }).createdAt!).toISOString()
          : new Date().toISOString(),
      };
    });

    const activitiesInRange = await ActivityLogModel.find({
      workspaceId: workspaceIdStr,
      occurredAt: { $gte: start, $lte: end },
    })
      .select("occurredAt action actorId")
      .lean();

    const meetingsInRange = await MeetingModel.find({
      workspaceId: workspaceObjId,
      createdAt: { $gte: start, $lte: end },
    })
      .select("createdAt startTime endTime participants")
      .lean();

    const activityByDay = new Map<string, number>();
    const loginByDay = new Map<string, number>();
    for (const act of activitiesInRange) {
      const day = new Date(act.occurredAt).toISOString().slice(0, 10);
      activityByDay.set(day, (activityByDay.get(day) || 0) + 1);
      if (act.action === "USER_LOGIN" || act.action === "LOGIN") {
        loginByDay.set(day, (loginByDay.get(day) || 0) + 1);
      }
    }

    const meetingByDay = new Map<string, number>();
    for (const m of meetingsInRange) {
      const day = new Date(m.createdAt).toISOString().slice(0, 10);
      meetingByDay.set(day, (meetingByDay.get(day) || 0) + 1);
    }

    const activityTrends: WorkspaceUserActivityTrendPoint[] = buckets.map((b) => ({
      date: b.date,
      label: b.label,
      activityCount: activityByDay.get(b.date) || 0,
      loginCount: loginByDay.get(b.date) || 0,
      meetingCount: meetingByDay.get(b.date) || 0,
    }));

    const userActivityMap = new Map<string, number>();
    const userLoginMap = new Map<string, number>();
    const userLastActiveMap = new Map<string, Date>();
    const userLastLoginMap = new Map<string, Date>();

    for (const act of activitiesInRange) {
      if (!act.actorId) continue;
      const aId = act.actorId;
      userActivityMap.set(aId, (userActivityMap.get(aId) || 0) + 1);

      if (!userLastActiveMap.has(aId) || new Date(act.occurredAt) > userLastActiveMap.get(aId)!) {
        userLastActiveMap.set(aId, new Date(act.occurredAt));
      }

      if (act.action === "USER_LOGIN" || act.action === "LOGIN") {
        userLoginMap.set(aId, (userLoginMap.get(aId) || 0) + 1);
        if (!userLastLoginMap.has(aId) || new Date(act.occurredAt) > userLastLoginMap.get(aId)!) {
          userLastLoginMap.set(aId, new Date(act.occurredAt));
        }
      }
    }

    const userMeetingsMap = new Map<string, number>();
    const userMeetingDurationMap = new Map<string, number>();

    for (const m of meetingsInRange) {
      const duration = m.startTime && m.endTime
        ? Math.max(0, Math.round((new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / (1000 * 60)))
        : 0;

      if (Array.isArray(m.participants)) {
        for (const p of m.participants) {
          const pId = p.toString();
          userMeetingsMap.set(pId, (userMeetingsMap.get(pId) || 0) + 1);
          userMeetingDurationMap.set(pId, (userMeetingDurationMap.get(pId) || 0) + duration);
        }
      }
    }

    const workspaceRooms = await RoomModel.find({ workspaceId: workspaceObjId })
      .select("_id type allowedUsers")
      .lean();

    const userRoomsCountMap = new Map<string, number>();
    for (const u of allMembers) {
      const uId = u._id.toString();
      const count = workspaceRooms.filter((r) => {
        if (r.type === "public") return true;
        return Array.isArray(r.allowedUsers) && r.allowedUsers.some((id: unknown) => id && id.toString() === uId);
      }).length;
      userRoomsCountMap.set(uId, count);
    }

    const userRankList: UserRankItem[] = allMembers.map((u) => {
      const uId = u._id.toString();
      const activityCount = userActivityMap.get(uId) || 0;
      const meetingsAttended = userMeetingsMap.get(uId) || 0;
      const totalMeetingDurationMinutes = userMeetingDurationMap.get(uId) || 0;
      const lastActive = userLastActiveMap.get(uId) || (u as { updatedAt?: Date }).updatedAt || null;

      return {
        userId: uId,
        username: u.username,
        email: u.email,
        activityCount,
        meetingsAttended,
        totalMeetingDurationMinutes,
        lastActiveAt: lastActive ? new Date(lastActive).toISOString() : null,
        isOnline: socketService.isUserOnline(uId),
      };
    });

    const sortedByActivityDesc = [...userRankList].sort(
      (a, b) => b.activityCount + b.meetingsAttended - (a.activityCount + a.meetingsAttended)
    );

    const topActiveUsers = sortedByActivityDesc.slice(0, 5);
    const leastActiveUsers = [...userRankList]
      .sort((a, b) => a.activityCount + a.meetingsAttended - (b.activityCount + b.meetingsAttended))
      .slice(0, 5);

    let filteredMembers = allMembers;
    if (input.search && input.search.trim()) {
      const q = input.search.trim().toLowerCase();
      filteredMembers = allMembers.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = input.limit && input.limit > 0 ? input.limit : 10;
    const totalRecords = filteredMembers.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const paginatedMembers = filteredMembers.slice((page - 1) * limit, page * limit);

    const recordItems: UserActivityRecordItem[] = paginatedMembers.map((u) => {
      const uId = u._id.toString();
      const lastActive = userLastActiveMap.get(uId) || (u as { updatedAt?: Date }).updatedAt || null;
      const lastLogin = userLastLoginMap.get(uId) || null;

      return {
        userId: uId,
        username: u.username,
        email: u.email,
        role: u.role || UserRoles.MEMBER,
        status: u.status !== false,
        isOnline: socketService.isUserOnline(uId),
        joinedAt: (u as { createdAt?: Date }).createdAt
          ? new Date((u as { createdAt?: Date }).createdAt!).toISOString()
          : new Date().toISOString(),
        lastActiveAt: lastActive ? new Date(lastActive).toISOString() : null,
        lastLoginAt: lastLogin ? new Date(lastLogin).toISOString() : null,
        totalLogins: userLoginMap.get(uId) || 0,
        meetingsAttended: userMeetingsMap.get(uId) || 0,
        meetingDurationMinutes: userMeetingDurationMap.get(uId) || 0,
        roomsCount: userRoomsCountMap.get(uId) || 0,
        activityCount: userActivityMap.get(uId) || 0,
      };
    });

    return {
      workspaceId: input.workspaceId,
      workspaceName: workspace.workspaceName,
      dateRange: {
        range: rangeType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      summary: {
        totalMembers,
        onlineCount,
        offlineCount,
        activeCount,
        inactiveCount,
      },
      recentlyJoined,
      activityTrends,
      topActiveUsers,
      leastActiveUsers,
      records: {
        items: recordItems,
        total: totalRecords,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getUserActivityHistory(
    input: GetUserActivityHistoryInputDTO
  ): Promise<UserActivityHistoryResponseDTO> {
    if (!Types.ObjectId.isValid(input.workspaceId) || !Types.ObjectId.isValid(input.userId)) {
      throw new AppError(MESSAGES.ERRORS.WORKSPACE_INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const workspace = await WorkspaceModel.findById(input.workspaceId);
    if (!workspace) {
      throw new AppError(MESSAGES.ERRORS.WORKSPACE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const isWsAdmin = workspace.workspaceAdminEmail?.toLowerCase() === input.adminEmail.toLowerCase();
    let isOrgOwner = false;
    if (!isWsAdmin && workspace.organizationId) {
      const org = await OrganizationModel.findById(workspace.organizationId).select("ownerEmail").lean();
      isOrgOwner = org?.ownerEmail?.toLowerCase() === input.adminEmail.toLowerCase();
    }
    if (!isWsAdmin && !isOrgOwner) {
      throw new AppError(MESSAGES.ERRORS.ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }

    const user = await UserModel.findOne({
      _id: input.userId,
      ...workspaceMembershipQuery(input.workspaceId),
    }).lean();

    if (!user) {
      throw new AppError(MESSAGES.ERRORS.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = input.limit && input.limit > 0 ? input.limit : 15;
    const skip = (page - 1) * limit;

    const query = {
      workspaceId: input.workspaceId,
      $or: [
        { actorId: input.userId },
        { targetId: input.userId },
      ],
    };

    const [logs, total, totalLogins, allUserMeetings, workspaceRooms] = await Promise.all([
      ActivityLogModel.find(query).sort({ occurredAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLogModel.countDocuments(query),
      ActivityLogModel.countDocuments({
        workspaceId: input.workspaceId,
        actorId: input.userId,
        action: { $in: ["USER_LOGIN", "LOGIN"] },
      }),
      MeetingModel.find({
        workspaceId: new Types.ObjectId(input.workspaceId),
        $or: [
          { hostId: new Types.ObjectId(input.userId) },
          { participants: new Types.ObjectId(input.userId) },
        ],
      }).lean(),
      RoomModel.find({ workspaceId: new Types.ObjectId(input.workspaceId) })
        .select("_id name type allowedUsers")
        .lean(),
    ]);

    let meetingDurationMinutes = 0;
    for (const m of allUserMeetings) {
      if (m.startTime && m.endTime) {
        meetingDurationMinutes += Math.max(0, Math.round((new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 60000));
      }
    }

    const accessibleRooms = workspaceRooms.filter((r) => {
      if (r.type === "public") return true;
      return Array.isArray(r.allowedUsers) && r.allowedUsers.some((id: any) => id && id.toString() === input.userId);
    });

    const items: UserActivityHistoryItem[] = logs.map((l) => ({
      _id: l._id.toString(),
      action: l.action,
      actorName: user.username,
      actorEmail: user.email,
      targetType: l.targetType,
      targetId: l.targetId,
      occurredAt: l.occurredAt.toISOString(),
      metadata: l.metadata as Record<string, unknown> | undefined,
    }));

    const finalUserId = user._id ? user._id.toString() : input.userId;

    return {
      user: {
        userId: finalUserId,
        username: user.username,
        email: user.email,
        role: user.role || UserRoles.MEMBER,
        status: user.status !== false,
        isOnline: socketService.isUserOnline(finalUserId),
      },
      stats: {
        totalLogins,
        meetingsAttended: allUserMeetings.length,
        meetingDurationMinutes,
        formattedMeetingDuration: formatDuration(meetingDurationMinutes),
        roomsCount: accessibleRooms.length,
        roomNames: accessibleRooms.map((r) => r.name),
        totalActions: total,
      },
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
