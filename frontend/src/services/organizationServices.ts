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
