import { MetricDelta } from "../../../../shared/metrics/sharedMetricsService.js";

export interface GetOwnerDashboardInputDTO {
  ownerEmail: string;
  range?: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface OwnerDashboardKPIs {
  workspaces: {
    active: number;
    total: number;
    suspended: number;
    archived: number;
    delta: MetricDelta;
  };
  totalMembers: {
    current: number;
    previous: number;
    deltaPercent: number;
    trend: "up" | "down" | "neutral";
  };
  onlineNow: {
    online: number;
    offline: number;
    total: number;
  };
  meetingsConducted: {
    completed: number;
    live: number;
    total: number;
    previous: number;
    deltaPercent: number;
    trend: "up" | "down" | "neutral";
  };
  meetingTime: {
    totalMinutes: number;
    formattedDuration: string;
    previousMinutes: number;
    deltaPercent: number;
    trend: "up" | "down" | "neutral";
  };
  activeRooms: {
    active: number;
    total: number;
    blocked: number;
    previous: number;
    deltaPercent: number;
    trend: "up" | "down" | "neutral";
  };
}

export interface PlanUsageMetric {
  current: number;
  limit: number | null;
  percent: number;
  isUnlimited: boolean;
  status: "normal" | "warning" | "exceeded"; // <80%, 80-99%, >=100%
}

export interface PlanUsageInfo {
  planId: string;
  planName: string;
  price: number;
  renewalDate: string | null;
  workspaces: PlanUsageMetric;
  rooms: PlanUsageMetric;
  members: PlanUsageMetric;
}

export interface OwnerActivityTrendPoint {
  date: string;
  label: string;
  activities: number;
  meetings: number;
}

export interface WorkspaceHealthItem {
  id: string;
  name: string;
  slug: string;
  status: "active" | "archived" | "suspended";
  memberCount: number;
  onlineNow: number;
  roomsCount: number;
  meetingsCount: number;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface WorkspaceHealthSummary {
  chips: {
    active: number;
    archived: number;
    suspended: number;
    total: number;
  };
  workspaces: WorkspaceHealthItem[];
}

export interface MemberDistributionItem {
  workspaceId: string;
  workspaceName: string;
  memberCount: number;
  percentage: number;
}

export interface OwnerRecentActivityItem {
  id: string;
  action: string;
  actorName: string;
  actorEmail?: string;
  actorRole?: string;
  workspaceName?: string;
  targetType?: string;
  occurredAt: string;
}

export interface OwnerDashboardResponseDTO {
  organization: {
    id: string;
    name: string;
    ownerName: string;
    ownerEmail: string;
    status: string;
  };
  dateRange: {
    range: string;
    startDate: string;
    endDate: string;
    prevStartDate: string;
    prevEndDate: string;
  };
  kpis: OwnerDashboardKPIs;
  planUsage: PlanUsageInfo;
  activityChart: OwnerActivityTrendPoint[];
  workspaceHealth: WorkspaceHealthSummary;
  memberDistribution: {
    showChart: boolean;
    items: MemberDistributionItem[];
  };
  recentActivities: OwnerRecentActivityItem[];
  lastUpdated: string;
}
