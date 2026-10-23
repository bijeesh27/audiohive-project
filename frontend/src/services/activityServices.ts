import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export const recordActivityLog = async (data: Record<string, unknown>) => {
  return axiosInstance.post(API_ENDPOINTS.ACTIVITY.RECORD, data).then((res) => res.data);
};

export const getWorkspaceActivityLogs = async (params?: { page?: number; limit?: number; search?: string }) => {
  return axiosInstance
    .get(API_ENDPOINTS.ACTIVITY.GET_WORKSPACE_LOGS, { params })
    .then((res) => res.data);
};

export const getOrganizationActivityLogs = async (
  organizationId: string,
  params?: { page?: number; limit?: number; search?: string }
) => {
  return axiosInstance
    .get(API_ENDPOINTS.ACTIVITY.GET_ORGANIZATION_LOGS(organizationId), { params })
    .then((res) => res.data);
};

export const getSystemActivityLogs = async (params?: { page?: number; limit?: number; search?: string }) => {
  return axiosInstance
    .get(API_ENDPOINTS.ACTIVITY.GET_SYSTEM_LOGS, { params })
    .then((res) => res.data);
};
