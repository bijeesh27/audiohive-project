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

export const getMemberWorkspaces = () => {
  return axiosInstance.get(API_ENDPOINTS.WORKSPACE.GET_MEMBER_WORKSPACES).then((res) => res.data);
};

export const switchMemberWorkspace = (workspaceId: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.SWITCH_WORKSPACE, { workspaceId })
    .then((res) => res.data);
};

export const createWorkspace = (data: Record<string, unknown>) => {
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
  return axiosInstance.post(API_ENDPOINTS.WORKSPACE.INVITE(workspaceId), data).then((res) => res.data);
};

export const inviteWorkspaceUser = (data: { email: string; invitedName: string; role: string }) => {
  return axiosInstance.post(API_ENDPOINTS.WORKSPACE_ADMIN.INVITE_USER, data).then((res) => res.data);
};

export const getWorkspace = (workspaceId: string) => {
  return axiosInstance.get(API_ENDPOINTS.WORKSPACE.GET_ONE(workspaceId)).then((res) => res.data);
};

export const blockWorkspace = (workspaceId: string, status: "active" | "suspended") => {
  return axiosInstance
    .put(API_ENDPOINTS.WORKSPACE.UPDATE(workspaceId), { status })
    .then((res) => res.data);
};

export const deleteWorkspace = (workspaceId: string) => {
  return axiosInstance
    .delete(API_ENDPOINTS.WORKSPACE.DELETE(workspaceId))
    .then((res) => res.data);
};

export const getWorkspaceUsers = (workspaceId: string, page: number = 1, limit: number = 10, search: string = "") => {
  let url = `${API_ENDPOINTS.WORKSPACE.GET_USERS(workspaceId)}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export const removeWorkspaceUser = (workspaceId: string, userId: string) => {
  return axiosInstance.delete(API_ENDPOINTS.WORKSPACE.REMOVE_USER(workspaceId, userId)).then((res) => res.data);
};
