import { MetricDelta } from "../../../../shared/metrics/sharedMetricsService.ts";

export interface SuperAdminDashboardQueryDTO {
  range?: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface SuperAdminKpiStats {
  organizations: {
    active: number;
    total: number;
    delta: MetricDelta;
  };
  users: {
    total: number;
    online: number;
    delta: MetricDelta;
  };
  workspaces: {
    total: number;
    delta: MetricDelta;
  };
  meetings: {
    conducted: number;
    totalDurationMinutes: number;
    formattedDuration: string;
    delta: MetricDelta;
    durationDelta: MetricDelta;
  };
  newOrganizations: {
    count: number;
    delta: MetricDelta;
  };
  subscriptions: {
    paid: number;
    total: number;
    delta: MetricDelta;
  };
}

export interface GrowthDataPoint {
  date: string;
  newOrganizations: number;
  newUsers: number;
}

export interface ActivityDataPoint {
  date: string;
  meetings: number;
  actions: number;
}

export interface PlanDistributionItem {
  planId: string;
  planName: string;
  count: number;
  percentage: number;
  price: number;
}

export interface TopOrganizationItem {
  id: string;
  name: string;
  planName: string;
  workspacesCount: number;
  membersCount: number;
  memberLimit: number | null;
  meetingsCount: number;
  lastActivity: string | null;
}

export interface NeedsAttentionItem {
  id: string;
  name: string;
  reason: "near_limit" | "expired_subscription" | "inactive_30d";
  details: string;
  metric: string;
  severity: "warning" | "danger" | "info";
}

export interface RecentActivityItem {
  id: string;
  action: string;
  details: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  organizationName?: string;
  timestamp: string;
}

export interface SuperAdminDashboardResponseDTO {
  range: string;
  periodStart: string;
  periodEnd: string;
  lastUpdated: string;
  kpis: SuperAdminKpiStats;
  growthChart: GrowthDataPoint[];
  activityChart: ActivityDataPoint[];
  planDistribution: PlanDistributionItem[];
  topOrganizations: TopOrganizationItem[];
  needsAttention: NeedsAttentionItem[];
  recentActivity: RecentActivityItem[];
}
