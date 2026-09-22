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

export const getActiveuserCount=(workspaceId:string)=>{
  return axiosInstance.get(`/activeusers/${workspaceId}`)
}
