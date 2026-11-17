import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export const getWorkspaceDashboardStats = () => {
  return axiosInstance
    .get(API_ENDPOINTS.WORKSPACE_ADMIN.DASHBOARD_STATS)
    .then((res) => res.data);
};

export const getWorkspaceAdminProfile = () => {
  return axiosInstance.get(API_ENDPOINTS.WORKSPACE_ADMIN.PROFILE);
};

export const getActiveuserCount = (workspaceId: string) => {
  return axiosInstance.get(API_ENDPOINTS.WORKSPACE_ADMIN.ACTIVE_USERS(workspaceId));
};

export interface WorkspaceUserAnalyticsParams {
  range?: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getWorkspaceUserAnalytics = (params?: WorkspaceUserAnalyticsParams) => {
  return axiosInstance
    .get(API_ENDPOINTS.WORKSPACE_ADMIN.USER_ANALYTICS, { params })
    .then((res) => res.data);
};

export const getUserActivityHistory = (
  userId: string,
  params?: { page?: number; limit?: number }
) => {
  return axiosInstance
    .get(API_ENDPOINTS.WORKSPACE_ADMIN.USER_ACTIVITY_HISTORY(userId), { params })
    .then((res) => res.data);
};

// ── Consolidated Dashboard API Types ──────────────────────────────────────

export interface MetricDelta {
  current: number;
  previous: number;
  deltaPercent: number;
  trend: "up" | "down" | "neutral";
}

export interface DashboardKPIs {
  totalMembers: MetricDelta & { current: number };
  onlineNow: {
    online: number;
    offline: number;
    total: number;
  };
  totalLogins: MetricDelta;
  meetings: MetricDelta & {
    meetingsHeld: number;
    totalMinutes: number;
    formattedDuration: string;
  };
  activeRooms: MetricDelta & {
    activeRooms: number;
    totalRooms: number;
  };
  totalActions: MetricDelta;
}

export interface ActivityChartPoint {
  date: string;
  label: string;
  actions: number;
  logins: number;
}

export interface LiveMember {
  userId: string;
  username: string;
  email: string;
  isOnline: boolean;
  currentRoom: {
    roomId: string;
    name: string;
  } | null;
  joinedAt: string;
}

export interface RecentlyJoinedMember {
  userId: string;
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
  joinedAt: string;
}

export interface LeaderboardUser {
  userId: string;
  username: string;
  email: string;
  isOnline: boolean;
  score: number;
  actionCount: number;
  meetingsCount: number;
  lastActiveAt: string | null;
  progressPercent: number;
}

export interface RoomUsage {
  roomId: string;
  name: string;
  type: string;
  activityCount: number;
  participantsCount: number;
  timeSpentMinutes: number;
}

export interface MeetingsOverview {
  scheduled: number;
  completed: number;
  live: number;
  avgDurationMinutes: number;
  formattedAvgDuration: string;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  actorId: string | null;
  actorName: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardData {
  workspaceId: string;
  workspaceName: string;
  adminName: string;
  dateRange: {
    range: string;
    startDate: string;
    endDate: string;
    prevStartDate: string;
    prevEndDate: string;
  };
  kpis: DashboardKPIs;
  chartSeries: ActivityChartPoint[];
  liveNow: LiveMember[];
  recentlyJoined: RecentlyJoinedMember[];
  leaderboard: {
    mostActive: LeaderboardUser[];
    needsEngagement: LeaderboardUser[];
  };
  roomUsage: {
    topRooms: RoomUsage[];
    meetingsOverview: MeetingsOverview;
  };
  recentActivities: RecentActivityItem[];
  lastUpdated: string;
}

export interface GetDashboardParams {
  range?: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
}

export const getWorkspaceDashboardData = (params?: GetDashboardParams) => {
  return axiosInstance
    .get(API_ENDPOINTS.WORKSPACE_ADMIN.DASHBOARD, { params })
    .then((res) => res.data);
};

export interface MemberActivityRecord {
  userId: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  isOnline: boolean;
  joinedAt: string;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
  totalLogins: number;
  meetingsAttended: number;
  meetingDurationMinutes: number;
  formattedMeetingDuration: string;
  roomsCount: number;
  activityCount: number;
}

export interface GetMembersActivityParams {
  range?: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: "all" | "active" | "disabled";
  sortField?: "logins" | "meetings" | "duration" | "rooms" | "actions" | "name" | "lastActive";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface MembersActivityResponse {
  items: MemberActivityRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getWorkspaceMembersActivity = (params?: GetMembersActivityParams) => {
  return axiosInstance
    .get(API_ENDPOINTS.WORKSPACE_ADMIN.DASHBOARD_MEMBERS, { params })
    .then((res) => res.data);
};
