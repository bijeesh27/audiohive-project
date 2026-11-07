export interface GetOrganizationAnalyticsInputDTO {
  ownerEmail: string;
  range?: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface WorkspaceMemberDistributionItem {
  workspaceId: string;
  workspaceName: string;
  memberCount: number;
  percentage: number;
  status: "active" | "suspended" | "archived";
}

export interface MostActiveWorkspaceItem {
  workspaceId: string;
  workspaceName: string;
  totalActivities: number;
  totalMeetings: number;
  totalMembers: number;
  status: string;
}

export interface OrganizationActivityTrendPoint {
  date: string;
  label: string;
  activitiesCount: number;
  meetingsCount: number;
}

export interface EnrichedRecentActivity {
  _id: string;
  action: string;
  actorName: string;
  actorEmail?: string;
  actorRole?: string;
  workspaceName?: string;
  targetType?: string;
  occurredAt: string;
}

export interface OrganizationAnalyticsResponseDTO {
  organizationId: string;
  organizationName: string;
  ownerEmail: string;
  dateRange: {
    range: string;
    startDate: string;
    endDate: string;
  };
  workspacesSummary: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pending: number;
  };
  membersSummary: {
    totalMembers: number;
    distribution: WorkspaceMemberDistributionItem[];
  };
  meetingsSummary: {
    totalMeetings: number;
    totalDurationMinutes: number;
    completedMeetings: number;
    liveMeetings: number;
    scheduledMeetings: number;
    cancelledMeetings: number;
  };
  roomsSummary: {
    totalRooms: number;
    activeRooms: number;
    blockedRooms: number;
    publicRooms: number;
    privateRooms: number;
  };
  activityTrends: OrganizationActivityTrendPoint[];
  mostActiveWorkspaces: MostActiveWorkspaceItem[];
  recentActivities: EnrichedRecentActivity[];
}

