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
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema";
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

const workspaceMembershipQuery = (workspaceId: string) => ({
  $or: [
    { workspaceIds: new Types.ObjectId(workspaceId) },
    { workspaceId: new Types.ObjectId(workspaceId) },
  ],
});

export class WorkspaceUserAnalyticsRepository
  implements IWorkspaceUserAnalyticsRepository
{
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

    // Verify workspace admin authorization
    if (workspace.workspaceAdminEmail?.toLowerCase() !== input.adminEmail.toLowerCase()) {
      throw new AppError(MESSAGES.ERRORS.ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }

    const { start, end, rangeType, buckets } = parseDateRange(
      input.range,
      input.startDate,
      input.endDate
    );

    const workspaceObjId = new Types.ObjectId(input.workspaceId);
    const workspaceIdStr = input.workspaceId;

    // 1. Fetch all members in this workspace
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

    // 2. Recently joined members (top 5)
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

    // 3. Activity trends in date range
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

    // 4. Per-user statistics in date range
    // Pre-calculate user activities and logins
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

    // Pre-calculate user meetings and durations
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

    // Rooms accessible in this workspace
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

    // Compute user rank list
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

    // 5. Search and Pagination for Records table
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

    if (workspace.workspaceAdminEmail?.toLowerCase() !== input.adminEmail.toLowerCase()) {
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

    const [logs, total] = await Promise.all([
      ActivityLogModel.find(query).sort({ occurredAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLogModel.countDocuments(query),
    ]);

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
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
