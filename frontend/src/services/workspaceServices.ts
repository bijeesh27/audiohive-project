import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";


export const getAllWorkspaces = (page: number = 1, limit: number = 10, search: string = "") => {
  let url = `${API_ENDPOINTS.WORKSPACE.GET_ALL}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export const getMyWorkspaces = (page: number = 1, limit: number = 10, search: string = "") => {
  let url = `${API_ENDPOINTS.WORKSPACE.GET_MY}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export const createWorkspace = (data: any) => {
  return axiosInstance.post(API_ENDPOINTS.WORKSPACE.CREATE, data).then((res) => res.data);
};

export const updateWorkspace = (
  workspaceId: string,
  data: {
    workspaceName?: string;
    slug?: string;
    status?: "active" | "suspended" | "archived";
  }
) => {
  return axiosInstance
    .put(API_ENDPOINTS.WORKSPACE.UPDATE(workspaceId), data)
    .then((res) => res.data);
};

export const approveWorkspaceApi = (data: {
  workspaceId: string;
  adminEmail: string;
  workspaceName: string;
}) => {
  return axiosInstance
    .post(API_ENDPOINTS.SUPER_ADMIN.APPROVE_WORKSPACE, data)
    .then((res) => res.data);
};

export const inviteWorkspaceAdmin = (workspaceId: string, data: { email: string; workspaceAdminName: string }) => {
  return axiosInstance.post(`/api/workspace/${workspaceId}/invite`, data).then((res) => res.data);
};

export const inviteWorkspaceUser = (data: { email: string; invitedName: string; role: string }) => {
  return axiosInstance.post('/api/workspaceadmin/invite-user', data).then((res) => res.data);
};

export const getWorkspace=(workspaceId:string)=>{
  return axiosInstance.get(`/api/workspace/getworkspace/${workspaceId}`).then((res)=>res.data)
}
export const blockWorkspace = (workspaceId: string, status: "active" | "suspended") => {
  return axiosInstance
    .put(API_ENDPOINTS.WORKSPACE.UPDATE(workspaceId), { status })
    .then((res) => res.data);
};
export const deleteWorkspace = (workspaceId: string) => {
  return axiosInstance
    .delete(`/api/workspace/deleteworkspace/${workspaceId}`)
    .then((res) => res.data);
};

export const getWorkspaceUsers = (workspaceId: string, page: number = 1, limit: number = 10, search: string = "") => {
  let url = `/api/workspace/${workspaceId}/users?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};