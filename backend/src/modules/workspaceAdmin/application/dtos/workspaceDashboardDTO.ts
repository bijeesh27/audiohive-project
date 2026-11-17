export interface GetWorkspaceDashboardInputDTO {
  workspaceId: string;
  adminEmail: string;
  range?: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface MetricDelta {
  current: number;
  previous: number;
  deltaPercent: number; // e.g. +12.5 or -5.0
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

export interface ActivityChartSeriesPoint {
  date: string;
  label: string;
  actions: number;
  logins: number;
}

export interface LiveMemberItem {
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

export interface RecentlyJoinedItem {
  userId: string;
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
  joinedAt: string;
}

export interface EngagementUserItem {
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

export interface RoomUsageItem {
  roomId: string;
  name: string;
  type: string;
  activityCount: number;
  participantsCount: number;
  timeSpentMinutes: number;
}

export interface MeetingsOverviewStats {
  scheduled: number;
  completed: number;
  live: number;
  avgDurationMinutes: number;
  formattedAvgDuration: string;
}

export interface RecentActivityFeedItem {
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

export interface WorkspaceDashboardResponseDTO {
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
  chartSeries: ActivityChartSeriesPoint[];
  liveNow: LiveMemberItem[];
  recentlyJoined: RecentlyJoinedItem[];
  leaderboard: {
    mostActive: EngagementUserItem[];
    needsEngagement: EngagementUserItem[];
  };
  roomUsage: {
    topRooms: RoomUsageItem[];
    meetingsOverview: MeetingsOverviewStats;
  };
  recentActivities: RecentActivityFeedItem[];
  lastUpdated: string;
}

export interface GetWorkspaceMembersActivityInputDTO {
  workspaceId: string;
  adminEmail: string;
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

export interface WorkspaceMemberActivityRecordItem {
  userId: string;
  username: string;
  email: string;
  role: string;
  status: boolean; // active/disabled
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

export interface WorkspaceMembersActivityResponseDTO {
  items: WorkspaceMemberActivityRecordItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

