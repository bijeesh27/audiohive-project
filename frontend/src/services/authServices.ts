import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export const login = (email: string, password: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.LOGIN, { email, password })
    .then((res) => res.data);
};

export const register = (username: string, email: string, password: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.REGISTER, { username, email, password })
    .then((res) => res.data);
};

export const verifyOtp = (email: string, otp: string, purpose: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp, purpose })
    .then((res) => res.data);
};

export const resetPassword = (token: string, password: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password })
    .then((res) => res.data);
};

export const forgotPassword = (email: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
    .then((res) => res.data);
};

export const getUsers = (page: number = 1, limit: number = 10, search: string = "") => {
  let url = `${API_ENDPOINTS.SUPER_ADMIN.GET_USERS}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export const worspaceAdminGetUsers = (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  role?: string,
  status?: string,
  sortField?: string,
  sortOrder?: "asc" | "desc",
) => {
  let url = `${API_ENDPOINTS.WORKSPACE_ADMIN.GET_USERS}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  if (role && role !== "all") {
    url += `&role=${encodeURIComponent(role)}`;
  }
  if (status && status !== "all") {
    url += `&status=${encodeURIComponent(status)}`;
  }
  if (sortField) {
    url += `&sortField=${encodeURIComponent(sortField)}`;
  }
  if (sortOrder) {
    url += `&sortOrder=${encodeURIComponent(sortOrder)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export interface OrganizationGetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  workspaceId?: string;
  role?: string;
  status?: string;
  presence?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export const organizationOwnerGetUsers = (
  paramsOrPage: OrganizationGetUsersParams | number = 1,
  limitArg: number = 10,
  searchArg: string = ""
) => {
  let url = API_ENDPOINTS.ORGANIZATION_ADMIN.GET_USERS;
  if (typeof paramsOrPage === "number") {
    url += `?page=${paramsOrPage}&limit=${limitArg}`;
    if (searchArg) {
      url += `&search=${encodeURIComponent(searchArg)}`;
    }
  } else {
    const params = new URLSearchParams();
    if (paramsOrPage.page) params.set("page", String(paramsOrPage.page));
    if (paramsOrPage.limit) params.set("limit", String(paramsOrPage.limit));
    if (paramsOrPage.search) params.set("search", paramsOrPage.search);
    if (paramsOrPage.workspaceId && paramsOrPage.workspaceId !== "all") params.set("workspaceId", paramsOrPage.workspaceId);
    if (paramsOrPage.role && paramsOrPage.role !== "all") params.set("role", paramsOrPage.role);
    if (paramsOrPage.status && paramsOrPage.status !== "all") params.set("status", paramsOrPage.status);
    if (paramsOrPage.presence && paramsOrPage.presence !== "all") params.set("presence", paramsOrPage.presence);
    if (paramsOrPage.sortField) params.set("sortField", paramsOrPage.sortField);
    if (paramsOrPage.sortOrder) params.set("sortOrder", paramsOrPage.sortOrder);
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export const organizationUpdateUserStatus = (userId: string, status: boolean) => {
  return axiosInstance
    .patch(API_ENDPOINTS.ORGANIZATION_ADMIN.UPDATE_USER_STATUS(userId), { status })
    .then((res) => res.data);
};

export const organizationUpdateUserRole = (userId: string, role: string) => {
  return axiosInstance
    .patch(API_ENDPOINTS.ORGANIZATION_ADMIN.UPDATE_USER_ROLE(userId), { role })
    .then((res) => res.data);
};

export const organizationRemoveUser = (userId: string) => {
  return axiosInstance
    .delete(API_ENDPOINTS.ORGANIZATION_ADMIN.REMOVE_USER(userId))
    .then((res) => res.data);
};

export const updateUserWorkspaces = (userId: string, workspaceIds: string[]) => {
  return axiosInstance
    .put(API_ENDPOINTS.ORGANIZATION_ADMIN.SET_USER_WORKSPACES(userId), { workspaceIds })
    .then((res) => res.data);
};


export const resendOtp = (email: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.RESEND_OTP, { email })
    .then((res) => res.data);
};

export const logout = () => {
  return axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
};

export const getInvitationDetails = (token: string) => {
  return axiosInstance
    .get(API_ENDPOINTS.AUTH.INVITATION_DETAILS(token))
    .then((res) => res.data)
};

export const registerWorkspaceAdmin = (username: string, password: string, token: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.REGISTER_ADMIN, { username, password, token })
    .then((res) => res.data);
};
export const registerOwner = (username: string, password: string, token: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.REGISTER_OWNER, { username, password, token })
    .then((res) => res.data);
};

export const registerWorkspaceUser = (username: string, password: string, token: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.REGISTER_USER, { username, password, token })
    .then((res) => res.data);
};

export const updateUser = (userId: string, data: Record<string, unknown>) => {
  return axiosInstance
    .patch(API_ENDPOINTS.AUTH.UPDATE_USER(userId), data)
    .then((res) => res.data);
};

// Used by workspace admin to block/unblock users (dedicated workspace-admin route)
export const updateWorkspaceUser = (userId: string, data: Record<string, unknown>) => {
  return axiosInstance
    .patch(API_ENDPOINTS.WORKSPACE_ADMIN.UPDATE_USER(userId), data)
    .then((res) => res.data);
};
