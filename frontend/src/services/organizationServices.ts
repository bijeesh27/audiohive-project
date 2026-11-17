import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export const createOrganization = async (data: Record<string, unknown>) => {
  await axiosInstance.post(API_ENDPOINTS.ORGANIZATION_ADMIN.CREATE, data).then((res) => res.data);
};

export const getAllOrganizations = async (page: number, limit: number, search?: string) => {
  return await axiosInstance
    .get(API_ENDPOINTS.ORGANIZATION_ADMIN.GET_ALL, {
      params: { page, limit, search },
    })
    .then((res) => res.data);
};

export const updateOrganization = async (id: string, data: Record<string, unknown>) => {
  return await axiosInstance
    .post(API_ENDPOINTS.ORGANIZATION_ADMIN.UPDATE(id), data)
    .then((res) => res.data);
};

export const getMyOrganization = async () => {
  return await axiosInstance.get(API_ENDPOINTS.ORGANIZATION_ADMIN.MY_ORGANIZATION).then((res) => res.data);
};

export const getOrgDashboardStats = async () => {
  return await axiosInstance.get(API_ENDPOINTS.ORGANIZATION_ADMIN.DASHBOARD_STATS).then((res) => res.data);
};

export interface OrgAnalyticsParams {
  range?: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
}

export const getOrganizationAnalytics = async (params?: OrgAnalyticsParams) => {
  return await axiosInstance
    .get(API_ENDPOINTS.ORGANIZATION_ADMIN.ANALYTICS, { params })
    .then((res) => res.data);
};

export interface MetricDelta {
  current: number;
  previous: number;
  deltaPercent: number;
  trend: "up" | "down" | "neutral";
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
  status: "normal" | "warning" | "exceeded";
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

export interface OwnerActivityPoint {
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

export interface OwnerDashboardData {
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
  activityChart: OwnerActivityPoint[];
  workspaceHealth: {
    chips: {
      active: number;
      archived: number;
      suspended: number;
      total: number;
    };
    workspaces: WorkspaceHealthItem[];
  };
  memberDistribution: {
    showChart: boolean;
    items: MemberDistributionItem[];
  };
  recentActivities: OwnerRecentActivityItem[];
  lastUpdated: string;
}

export const getOwnerDashboard = async (params?: OrgAnalyticsParams): Promise<{ data: OwnerDashboardData }> => {
  return await axiosInstance
    .get(API_ENDPOINTS.ORGANIZATION_ADMIN.DASHBOARD, { params })
    .then((res) => res.data);
};
