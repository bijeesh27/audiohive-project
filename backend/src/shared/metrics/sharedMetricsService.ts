import { Types } from "mongoose";
import { UserModel } from "../User.utils/userSchema.js";
import { WorkspaceModel } from "../../modules/workspace/infrastructure/workspaceSchema.js";
import { RoomModel } from "../../modules/room/infrastructure/roomSchema.js";
import { MeetingModel } from "../../modules/meeting/infrastructure/meetingSchema.js";
import { ActivityLogModel } from "../../modules/activityLog/infrastructure/activitylogSchema.js";
import { socketService } from "../../socket/socketService.js";
import { UserRoles } from "../../common/constant/userRoles.js";
import { buildWorkspaceMembershipQuery, WORKSPACE_MEMBER_ROLES } from "../User.utils/workspaceMembership.js";

/**
 * ============================================================================
 * UNIFIED METRICS SPECIFICATION & DEFINITIONS
 * ============================================================================
 * 
 * 1. WHAT COUNTS AS A "MEMBER":
 *    - An account with role in [member, workspaceadmin, workspace-admin]
 *      assigned to the workspace via workspaceIds or legacy workspaceId.
 *    - The Organization Owner (role 'organization-owner') is the billing & org administrator,
 *      not counted as a standard workspace member unless explicitly invited to a workspace.
 *    - "Total Members": All assigned user accounts (active + disabled).
 *    - "Active Members": Members with status !== false.
 *    - "Online Members": Members with active socket connection right now.
 *
 * 2. WHAT COUNTS AS AN "ACTIVE ROOM":
 *    - A room belonging to the workspace (or org's active workspaces) with status === "active".
 *    - "Total Rooms": All room documents in the workspace (standard, lounge, public, private).
 *    - "Active Rooms": status === "active" (administratively open and usable).
 *    - "Blocked Rooms": status === "blocked".
 *    - Rooms in archived or suspended workspaces are excluded from active counts.
 *
 * 3. WHAT COUNTS AS A "MEETING" & "MEETINGS CONDUCTED":
 *    - "Meetings Conducted": ONLY meetings that actually occurred (status === "completed" OR "live").
 *      Scheduled meetings (status === "scheduled") that haven't occurred, and cancelled
 *      meetings (status === "cancelled") are strictly excluded from "conducted" totals.
 *    - "Total Meeting Time": The conducted duration (endTime - startTime) for completed meetings,
 *      plus any verified call durations from CALL_ATTENDED activity logs.
 *    - "Scheduled Meetings": status === "scheduled" (future / upcoming).
 *    - "Cancelled Meetings": status === "cancelled".
 *
 * 4. WHAT COUNTS AS A "USER" (PLATFORM-WIDE):
 *    - Platform users are all non-superadmin accounts across all organizations and workspaces
 *      (roles in [organization-owner, workspaceadmin, workspace-admin, member]).
 *    - "Total Users": All non-superadmin accounts (active + disabled).
 *    - "Active Users": Non-superadmin accounts with status !== false.
 *    - "Online Users": Non-superadmin accounts currently possessing an active socket connection.
 *    - "Disabled Users": Non-superadmin accounts with status === false.
 *    - Consistent with Workspace Admin and Org Owner portals: Workspace Admin counts members assigned
 *      to its workspace; Org Owner counts members across its workspaces; Super Admin counts platform-wide
 *      users across all organizations plus organization owners.
 *
 * 5. WHAT COUNTS AS AN "ACTIVE ORGANIZATION":
 *    - An organization whose status is "active" (not suspended or archived) AND has recorded
 *      at least one conducted meeting, room activity, or audit activity within the last 30 days
 *      (or was created within the last 30 days).
 * ============================================================================
 */

export interface MetricDelta {
  current: number;
  previous: number;
  deltaPercent: number;
  trend: "up" | "down" | "neutral";
}

export const computeDelta = (current: number, previous: number): MetricDelta => {
  if (previous === 0) {
    if (current === 0) {
      return { current, previous, deltaPercent: 0, trend: "neutral" };
    }
    return { current, previous, deltaPercent: 100, trend: "up" };
  }
  const deltaPercent = Math.round(((current - previous) / previous) * 1000) / 10;
  const trend = deltaPercent > 0 ? "up" : deltaPercent < 0 ? "down" : "neutral";
  return { current, previous, deltaPercent, trend };
};

export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return "0m";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

/**
 * Builds a query that safely matches users belonging to any of the provided workspace IDs,
 * supporting both ObjectId and string representations in workspaceIds array and legacy workspaceId.
 */
export function buildMultiWorkspaceMembershipQuery(workspaceIds: string[] | Types.ObjectId[]) {
  const stringIds = workspaceIds.map((id) => id.toString());
  const validObjectIds = stringIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));

  return {
    $or: [
      { workspaceIds: { $in: [...stringIds, ...validObjectIds] } },
      { workspaceId: { $in: [...stringIds, ...validObjectIds] } },
    ],
  };
}

export interface UnifiedMembersResult {
  totalMembers: number;
  activeMembers: number;
  disabledMembers: number;
  onlineCount: number;
  offlineCount: number;
  membersDelta: MetricDelta;
  allMembers: Array<{
    _id: string;
    username: string;
    email: string;
    role: string;
    status: boolean;
    workspaceIds?: string[];
    workspaceId?: string;
    createdAt?: Date;
  }>;
  distribution: Array<{
    workspaceId: string;
    workspaceName: string;
    memberCount: number;
    percentage: number;
    status: string;
  }>;
}

export interface UnifiedRoomsResult {
  totalRooms: number;
  activeRooms: number;
  blockedRooms: number;
  publicRooms: number;
  privateRooms: number;
  loungeRooms: number;
  activeRoomsDelta: MetricDelta;
}

export interface UnifiedMeetingsResult {
  meetingsConducted: number;
  completedMeetings: number;
  liveMeetings: number;
  scheduledMeetings: number;
  cancelledMeetings: number;
  totalDurationMinutes: number;
  formattedDuration: string;
  meetingsDelta: MetricDelta;
  durationDelta: MetricDelta;
  userMeetingsMap: Map<string, number>;
  userMeetingDurationMap: Map<string, number>;
}

export class SharedMetricsService {
  /**
   * Fetches unified member counts and workspace distribution across one or more workspaces.
   */
  static async getMembersMetrics(
    workspaceIds: string[],
    workspaces: Array<{ _id: Types.ObjectId | string; workspaceName: string; status: string }>,
    prevEnd?: Date
  ): Promise<UnifiedMembersResult> {
    if (workspaceIds.length === 0) {
      return {
        totalMembers: 0,
        activeMembers: 0,
        disabledMembers: 0,
        onlineCount: 0,
        offlineCount: 0,
        membersDelta: computeDelta(0, 0),
        allMembers: [],
        distribution: [],
      };
    }

    const membershipCondition = buildMultiWorkspaceMembershipQuery(workspaceIds);
    const memberRoleFilter = {
      role: { $in: WORKSPACE_MEMBER_ROLES },
      ...membershipCondition,
    };

    const rawMembers = await UserModel.find(memberRoleFilter)
      .select("_id username email role status workspaceIds workspaceId createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const allMembers = rawMembers.map((m) => ({
      _id: m._id.toString(),
      username: m.username,
      email: m.email,
      role: m.role || UserRoles.MEMBER,
      status: m.status !== false,
      workspaceIds: Array.isArray(m.workspaceIds) ? m.workspaceIds.map((id: unknown) => id ? (id as Types.ObjectId).toString() : "") : [],
      workspaceId: m.workspaceId ? (m.workspaceId as Types.ObjectId).toString() : undefined,
      createdAt: (m as { createdAt?: Date }).createdAt,
    }));

    const totalMembers = allMembers.length;
    let activeMembers = 0;
    let disabledMembers = 0;
    let onlineCount = 0;

    for (const m of allMembers) {
      if (m.status) activeMembers++;
      else disabledMembers++;

      if (socketService.isUserOnline(m._id)) {
        onlineCount++;
      }
    }
    const offlineCount = Math.max(0, totalMembers - onlineCount);

    // Previous period calculation
    const prevCount = prevEnd
      ? allMembers.filter((m) => (m.createdAt ? new Date(m.createdAt) <= prevEnd : true)).length
      : totalMembers;
    const membersDelta = computeDelta(totalMembers, prevCount);

    // Workspace member distribution
    const distribution = workspaces.map((w) => {
      const wIdStr = w._id.toString();
      const count = allMembers.filter((m) => {
        const inWorkspaceIds = m.workspaceIds?.includes(wIdStr);
        const inWorkspaceId = m.workspaceId === wIdStr;
        return inWorkspaceIds || inWorkspaceId;
      }).length;

      const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
      return {
        workspaceId: wIdStr,
        workspaceName: w.workspaceName,
        memberCount: count,
        percentage,
        status: w.status,
      };
    });

    return {
      totalMembers,
      activeMembers,
      disabledMembers,
      onlineCount,
      offlineCount,
      membersDelta,
      allMembers,
      distribution,
    };
  }

  /**
   * Fetches unified room metrics across one or more workspaces.
   * Defined as: active = status === "active", total = total room documents.
   */
  static async getRoomsMetrics(
    workspaceIds: string[],
    prevEnd?: Date
  ): Promise<UnifiedRoomsResult> {
    if (workspaceIds.length === 0) {
      return {
        totalRooms: 0,
        activeRooms: 0,
        blockedRooms: 0,
        publicRooms: 0,
        privateRooms: 0,
        loungeRooms: 0,
        activeRoomsDelta: computeDelta(0, 0),
      };
    }

    const validObjIds = workspaceIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    const roomQuery = {
      $or: [
        { workspaceId: { $in: validObjIds } },
        { workspaceId: { $in: workspaceIds } },
      ],
    };

    const rooms = await RoomModel.find(roomQuery)
      .select("_id name type status isDefault allowedUsers createdAt")
      .lean();

    const totalRooms = rooms.length;
    const activeRooms = rooms.filter((r) => r.status === "active").length;
    const blockedRooms = rooms.filter((r) => r.status === "blocked").length;
    const publicRooms = rooms.filter((r) => r.type === "public").length;
    const privateRooms = rooms.filter((r) => r.type === "private").length;
    const loungeRooms = rooms.filter((r) => r.type === "lounge" || r.isDefault).length;

    const prevActiveRoomsCount = prevEnd
      ? rooms.filter((r) => r.status === "active" && ((r as { createdAt?: Date }).createdAt ? new Date((r as { createdAt?: Date }).createdAt!) <= prevEnd : true)).length
      : activeRooms;

    const activeRoomsDelta = computeDelta(activeRooms, prevActiveRoomsCount);

    return {
      totalRooms,
      activeRooms,
      blockedRooms,
      publicRooms,
      privateRooms,
      loungeRooms,
      activeRoomsDelta,
    };
  }

  /**
   * Fetches unified meeting metrics and duration across one or more workspaces for a date range.
   * Defined as: Conducted meetings = status in ["completed", "live"].
   * Duration = (endTime - startTime) for conducted meetings + actual CALL_ATTENDED activity log durations.
   */
  static async getMeetingsMetrics(
    workspaceIds: string[],
    start: Date,
    end: Date,
    prevStart?: Date,
    prevEnd?: Date
  ): Promise<UnifiedMeetingsResult> {
    if (workspaceIds.length === 0) {
      return {
        meetingsConducted: 0,
        completedMeetings: 0,
        liveMeetings: 0,
        scheduledMeetings: 0,
        cancelledMeetings: 0,
        totalDurationMinutes: 0,
        formattedDuration: "0m",
        meetingsDelta: computeDelta(0, 0),
        durationDelta: computeDelta(0, 0),
        userMeetingsMap: new Map(),
        userMeetingDurationMap: new Map(),
      };
    }

    const validObjIds = workspaceIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    const workspaceMatch = {
      $or: [
        { workspaceId: { $in: validObjIds } },
        { workspaceId: { $in: workspaceIds } },
      ],
    };

    // Current period meetings
    const meetingsCurrent = await MeetingModel.find({
      ...workspaceMatch,
      $or: [
        { startTime: { $gte: start, $lte: end } },
        { createdAt: { $gte: start, $lte: end } },
      ],
    }).lean();

    // Current period call logs from ActivityLog
    const callLogsCurrent = await ActivityLogModel.find({
      workspaceId: { $in: workspaceIds },
      action: "CALL_ATTENDED",
      occurredAt: { $gte: start, $lte: end },
    }).lean();

    let completedMeetings = 0;
    let liveMeetings = 0;
    let scheduledMeetings = 0;
    let cancelledMeetings = 0;
    let totalDurationMinutes = 0;

    const userMeetingsMap = new Map<string, number>();
    const userMeetingDurationMap = new Map<string, number>();

    for (const m of meetingsCurrent) {
      if (m.status === "completed") completedMeetings++;
      else if (m.status === "live") liveMeetings++;
      else if (m.status === "scheduled") scheduledMeetings++;
      else if (m.status === "cancelled") cancelledMeetings++;

      // ONLY count duration for conducted meetings (completed or live)
      const isConducted = m.status === "completed" || m.status === "live";
      const duration = isConducted && m.startTime && m.endTime
        ? Math.max(0, Math.round((new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 60000))
        : 0;

      if (isConducted) {
        totalDurationMinutes += duration;

        const attendees = new Set<string>();
        if (m.hostId) attendees.add(m.hostId.toString());
        if (Array.isArray(m.participants)) {
          for (const p of m.participants) {
            if (p) attendees.add(p.toString());
          }
        }

        attendees.forEach((pId) => {
          userMeetingsMap.set(pId, (userMeetingsMap.get(pId) || 0) + 1);
          userMeetingDurationMap.set(pId, (userMeetingDurationMap.get(pId) || 0) + duration);
        });
      }
    }

    // Incorporate ad-hoc CALL_ATTENDED log durations
    for (const log of callLogsCurrent) {
      if (log.actorId) {
        const dur = Number(log.metadata?.durationMinutes || 0);
        if (dur > 0) {
          totalDurationMinutes += dur;
          userMeetingDurationMap.set(log.actorId, (userMeetingDurationMap.get(log.actorId) || 0) + dur);
        }
      }
    }

    const meetingsConducted = completedMeetings + liveMeetings;

    // Previous period meetings for deltas
    let prevConducted = 0;
    let prevDuration = 0;
    if (prevStart && prevEnd) {
      const meetingsPrev = await MeetingModel.find({
        ...workspaceMatch,
        $or: [
          { startTime: { $gte: prevStart, $lt: start } },
          { createdAt: { $gte: prevStart, $lt: start } },
        ],
      }).lean();

      for (const m of meetingsPrev) {
        if (m.status === "completed" || m.status === "live") {
          prevConducted++;
          if (m.startTime && m.endTime) {
            prevDuration += Math.max(0, Math.round((new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 60000));
          }
        }
      }

      const callLogsPrev = await ActivityLogModel.find({
        workspaceId: { $in: workspaceIds },
        action: "CALL_ATTENDED",
        occurredAt: { $gte: prevStart, $lt: start },
      }).lean();

      for (const log of callLogsPrev) {
        prevDuration += Number(log.metadata?.durationMinutes || 0);
      }
    }

    const meetingsDelta = computeDelta(meetingsConducted, prevConducted);
    const durationDelta = computeDelta(totalDurationMinutes, prevDuration);

    return {
      meetingsConducted,
      completedMeetings,
      liveMeetings,
      scheduledMeetings,
      cancelledMeetings,
      totalDurationMinutes,
      formattedDuration: formatDuration(totalDurationMinutes),
      meetingsDelta,
      durationDelta,
      userMeetingsMap,
      userMeetingDurationMap,
    };
  }
}
