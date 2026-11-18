import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface MetricDelta {
  current: number;
  previous: number;
  deltaPercent: number;
  trend: "up" | "down" | "neutral";
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

export interface SuperAdminDashboardData {
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

export interface DashboardQueryParams {
  range?: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
}

export const getSuperAdminDashboardAnalytics = (
  params?: DashboardQueryParams
): Promise<{ data: SuperAdminDashboardData }> => {
  const searchParams = new URLSearchParams();
  if (params?.range) searchParams.set("range", params.range);
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);

  const queryStr = searchParams.toString();
  const url = `${API_ENDPOINTS.SUPER_ADMIN.DASHBOARD_ANALYTICS}${queryStr ? `?${queryStr}` : ""}`;
  return axiosInstance.get(url).then((res) => res.data);
};

export const getSuperAdminDashboardStats = () => {
  return axiosInstance
    .get(API_ENDPOINTS.SUPER_ADMIN.DASHBOARD_STATS)
    .then((res) => res.data);
};

export const getAllusers = (page: number = 1, limit: number = 10, search?: string) => {
  let url = `${API_ENDPOINTS.SUPER_ADMIN.GET_USERS}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

// --- Organizations Management Types & APIs ---

export interface IEnrichedOrganization {
  _id: string;
  companyName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  status: "active" | "suspended" | "pending" | "archived";
  planId: string;
  planName: string;
  planPrice: number;
  planMissing: boolean;
  workspacesCount: number;
  membersCount: number;
  memberLimit: number | null;
  nearLimit: boolean;
  lastActivity: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ISuperAdminOrgListResponse {
  organizations: IEnrichedOrganization[];
  total: number;
  activeCount: number;
  totalAll: number;
  plans: Array<{ id: string; name: string; price: number }>;
}

export interface ISuperAdminOrgParams {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  status?: string;
  nearLimit?: boolean | string;
  sort?: "newest" | "oldest" | "name" | "members" | "lastActivity";
}

export interface IOrganizationDetailData {
  organization: IEnrichedOrganization & {
    maxWorkspaces: number;
    maxRooms: number;
    features: string[];
  };
  owner: {
    _id?: string;
    username: string;
    email: string;
    role: string;
    status: boolean;
  } | null;
  kpis: {
    workspacesCount: number;
    membersCount: number;
    memberLimit: number | null;
    onlineNow: number;
    meetings30d: number;
    meetingMinutes30d: number;
    formattedMeetingDuration: string;
  };
  workspaces: Array<{
    _id: string;
    workspaceName: string;
    status: string;
    membersCount: number;
    roomsCount: number;
    createdAt: string;
  }>;
  subscription: {
    planId: string;
    planName: string;
    price: number;
    status: string;
    maxWorkspaces: number;
    features: string[];
    renewalDate: string | null;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    details: string;
    actorName: string;
    timestamp: string;
  }>;
}

export const getSuperAdminOrganizations = (
  params?: ISuperAdminOrgParams
): Promise<{ data: ISuperAdminOrgListResponse }> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.plan) searchParams.set("plan", params.plan);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.nearLimit) searchParams.set("nearLimit", String(params.nearLimit));
  if (params?.sort) searchParams.set("sort", params.sort);

  const queryStr = searchParams.toString();
  const url = `/api/superadmin/organizations${queryStr ? `?${queryStr}` : ""}`;
  return axiosInstance.get(url).then((res) => res.data);
};

export const getSuperAdminOrganizationDetails = (
  id: string
): Promise<{ data: IOrganizationDetailData }> => {
  return axiosInstance
    .get(`/api/superadmin/organizations/${id}`)
    .then((res) => res.data);
};

export const updateSuperAdminOrganizationStatus = (
  id: string,
  status: "active" | "suspended" | "archived",
  reason?: string
) => {
  return axiosInstance
    .patch(`/api/superadmin/organizations/${id}/status`, { status, reason })
    .then((res) => res.data);
};

export const updateSuperAdminOrganizationPlan = (
  id: string,
  planId: string
) => {
  return axiosInstance
    .patch(`/api/superadmin/organizations/${id}/plan`, { planId })
    .then((res) => res.data);
};

export const updateSuperAdminOrganizationDetails = (
  id: string,
  data: { companyName?: string; slug?: string; ownerName?: string; ownerEmail?: string }
) => {
  return axiosInstance
    .patch(`/api/superadmin/organizations/${id}`, data)
    .then((res) => res.data);
};

export const deleteSuperAdminOrganization = (id: string) => {
  return axiosInstance
    .delete(`/api/superadmin/organizations/${id}`)
    .then((res) => res.data);
};

// --- Platform Users Types & APIs ---

export interface IPlatformUserItem {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  isOnline: boolean;
  lastActiveAt: string | null;
  joinedAt: string;
  organization: {
    _id: string;
    companyName: string;
    slug: string;
  } | null;
  workspaces: Array<{
    _id: string;
    workspaceName: string;
  }>;
  isOwner: boolean;
  isSoleAdmin: boolean;
  soleAdminWorkspaceNames?: string[];
}

export interface IPlatformUsersStats {
  totalUsers: number;
  ownersCount: number;
  membersCount: number;
  onlineCount: number;
}

export interface IGetSuperAdminUsersResponse {
  success: boolean;
  message: string;
  data: {
    users: IPlatformUserItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: IPlatformUsersStats;
    filterOptions: {
      organizations: Array<{ _id: string; companyName: string; slug: string }>;
      workspaces: Array<{ _id: string; workspaceName: string; organizationId?: string }>;
    };
  };
}

export interface IGetSuperAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  presence?: string;
  organizationId?: string;
  workspaceId?: string;
  sort?: "newest" | "oldest" | "name" | "lastActive";
}

export const getSuperAdminUsers = (
  params?: IGetSuperAdminUsersParams
): Promise<IGetSuperAdminUsersResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.role && params.role !== "all") searchParams.set("role", params.role);
  if (params?.status && params.status !== "all") searchParams.set("status", params.status);
  if (params?.presence && params.presence !== "all") searchParams.set("presence", params.presence);
  if (params?.organizationId && params.organizationId !== "all")
    searchParams.set("organizationId", params.organizationId);
  if (params?.workspaceId && params.workspaceId !== "all")
    searchParams.set("workspaceId", params.workspaceId);
  if (params?.sort) searchParams.set("sort", params.sort);

  const queryStr = searchParams.toString();
  const url = `/api/superadmin/users${queryStr ? `?${queryStr}` : ""}`;
  return axiosInstance.get(url).then((res) => res.data);
};

export const toggleSuperAdminUserStatus = (
  userId: string,
  status: boolean
): Promise<{ success: boolean; message: string; data: { success: boolean; status: boolean } }> => {
  return axiosInstance
    .patch(`/api/superadmin/users/${userId}/status`, { status })
    .then((res) => res.data);
};

// --- Plans & Subscriptions Management Types & APIs ---

export interface ISuperAdminPlan {
  _id: string;
  subscriptionName: string;
  key: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  description: string;
  maxWorkspaces: number;
  maxRooms: number;
  features: string[];
  isActive: boolean;
  status: "active" | "inactive" | "archived";
  isDefault: boolean;
  isRecommended: boolean;
  displayOrder: number;
  subscriberCount: number;
  activeSubscriberCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPlanImpactResult {
  canSave: boolean;
  subscriberCount: number;
  affectedOrganizations: Array<{
    _id: string;
    companyName: string;
    slug: string;
    currentWorkspaces: number;
    allowedWorkspaces: number;
    exceededBy: number;
  }>;
  warningMessage?: string;
}

export interface ISuperAdminSubscriptionItem {
  organizationId: string;
  companyName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  orgStatus: "active" | "suspended" | "pending" | "archived";
  plan: {
    _id: string;
    subscriptionName: string;
    price: number;
    currency: string;
    interval: string;
    maxWorkspaces: number;
  };
  startedAt: string;
  workspacesCount: number;
  nearLimit: boolean;
  usagePercent: number;
}

export interface IGetSuperAdminSubscriptionsParams {
  page?: number;
  limit?: number;
  search?: string;
  planId?: string;
  status?: string;
  nearLimit?: boolean;
  sort?: "newest" | "oldest" | "name" | "workspaces";
}

export interface IGetSuperAdminSubscriptionsResponse {
  success: boolean;
  message: string;
  data: {
    subscriptions: ISuperAdminSubscriptionItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filterOptions: {
      plans: Array<{ _id: string; subscriptionName: string; price: number }>;
    };
  };
}

export const getSuperAdminPlans = (): Promise<{ success: boolean; data: ISuperAdminPlan[] }> => {
  return axiosInstance.get("/api/superadmin/plans").then((res) => res.data);
};

export const checkPlanImpact = (
  planId: string,
  newMaxWorkspaces: number
): Promise<{ success: boolean; data: IPlanImpactResult }> => {
  return axiosInstance
    .get(`/api/superadmin/plans/${planId}/impact?newMaxWorkspaces=${newMaxWorkspaces}`)
    .then((res) => res.data);
};

export const createSuperAdminPlan = (
  data: Partial<ISuperAdminPlan>
): Promise<{ success: boolean; message: string; data: ISuperAdminPlan }> => {
  return axiosInstance.post("/api/superadmin/plans", data).then((res) => res.data);
};

export const updateSuperAdminPlan = (
  id: string,
  data: Partial<ISuperAdminPlan>
): Promise<{ success: boolean; message: string; data: ISuperAdminPlan }> => {
  return axiosInstance.patch(`/api/superadmin/plans/${id}`, data).then((res) => res.data);
};

export const updateSuperAdminPlanStatus = (
  id: string,
  status: "active" | "inactive" | "archived"
): Promise<{ success: boolean; message: string; data: ISuperAdminPlan }> => {
  return axiosInstance.patch(`/api/superadmin/plans/${id}/status`, { status }).then((res) => res.data);
};

export const setDefaultSuperAdminPlan = (
  id: string
): Promise<{ success: boolean; message: string; data: ISuperAdminPlan }> => {
  return axiosInstance.patch(`/api/superadmin/plans/${id}/default`).then((res) => res.data);
};

export const deleteSuperAdminPlan = (
  id: string
): Promise<{ success: boolean; message: string }> => {
  return axiosInstance.delete(`/api/superadmin/plans/${id}`).then((res) => res.data);
};

export const getSuperAdminSubscriptions = (
  params?: IGetSuperAdminSubscriptionsParams
): Promise<IGetSuperAdminSubscriptionsResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.planId && params.planId !== "all") searchParams.set("planId", params.planId);
  if (params?.status && params.status !== "all") searchParams.set("status", params.status);
  if (params?.nearLimit) searchParams.set("nearLimit", "true");
  if (params?.sort) searchParams.set("sort", params.sort);

  const queryStr = searchParams.toString();
  return axiosInstance
    .get(`/api/superadmin/subscriptions${queryStr ? `?${queryStr}` : ""}`)
    .then((res) => res.data);
};

export const changeSuperAdminSubscriptionPlan = (
  orgId: string,
  planId: string
): Promise<{ success: boolean; message: string }> => {
  return axiosInstance
    .patch(`/api/superadmin/subscriptions/${orgId}/plan`, { planId })
    .then((res) => res.data);
};
