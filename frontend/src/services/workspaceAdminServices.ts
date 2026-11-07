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
