export interface GetWorkspaceUserAnalyticsInputDTO {
  workspaceId: string;
  adminEmail: string;
  range?: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserActivityRecordItem {
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
  roomsCount: number;
  activityCount: number;
}

export interface WorkspaceUserSummaryDTO {
  totalMembers: number;
  onlineCount: number;
  offlineCount: number;
  activeCount: number;
  inactiveCount: number;
}

export interface RecentlyJoinedMemberItem {
  userId: string;
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
  joinedAt: string;
}

export interface WorkspaceUserActivityTrendPoint {
  date: string;
  label: string;
  activityCount: number;
  loginCount: number;
  meetingCount: number;
}

export interface UserRankItem {
  userId: string;
  username: string;
  email: string;
  activityCount: number;
  meetingsAttended: number;
  totalMeetingDurationMinutes: number;
  lastActiveAt: string | null;
  isOnline: boolean;
}

export interface WorkspaceUserAnalyticsResponseDTO {
  workspaceId: string;
  workspaceName: string;
  dateRange: {
    range: string;
    startDate: string;
    endDate: string;
  };
  summary: WorkspaceUserSummaryDTO;
  recentlyJoined: RecentlyJoinedMemberItem[];
  activityTrends: WorkspaceUserActivityTrendPoint[];
  topActiveUsers: UserRankItem[];
  leastActiveUsers: UserRankItem[];
  records: {
    items: UserActivityRecordItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetUserActivityHistoryInputDTO {
  workspaceId: string;
  userId: string;
  adminEmail: string;
  page?: number;
  limit?: number;
}

export interface UserActivityHistoryItem {
  _id: string;
  action: string;
  actorName: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface UserActivityHistoryResponseDTO {
  user: {
    userId: string;
    username: string;
    email: string;
    role: string;
    status: boolean;
    isOnline: boolean;
  };
  items: UserActivityHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

