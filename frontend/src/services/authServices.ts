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

export const worspaceAdminGetUsers = (page: number = 1, limit: number = 10, search: string = "") => {
  let url = `${API_ENDPOINTS.WORKSPACE_ADMIN.GET_USERS}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export const moderatorGetUsers = (page: number = 1, limit: number = 10, search: string = "") => {
  let url = `${API_ENDPOINTS.MODERATOR.GET_USERS}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
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
    .post('api/auth/create-owner', { username, password, token })
    .then((res) => res.data);
};

export const updateUser = (userId: string, data: Partial<User>) => {
  return axiosInstance
    .patch(API_ENDPOINTS.AUTH.UPDATE_USER(userId), data)
    .then((res) => res.data);
};