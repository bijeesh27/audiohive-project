import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export const getSuperAdminDashboardStats = () => {
  return axiosInstance
    .get(API_ENDPOINTS.SUPER_ADMIN.DASHBOARD_STATS)
    .then((res) => res.data);
};

export const getAllusers=(page, limit, search)=>{
 let url = `${API_ENDPOINTS.SUPER_ADMIN.GET_USERS}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
}
