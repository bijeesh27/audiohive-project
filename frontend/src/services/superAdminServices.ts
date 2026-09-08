import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export const getSuperAdminDashboardStats = () => {
  return axiosInstance
    .get(API_ENDPOINTS.SUPER_ADMIN.DASHBOARD_STATS)
    .then((res) => res.data);
};
