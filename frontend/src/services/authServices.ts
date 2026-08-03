import axiosInstance from "../config/axios";

export const login = (email: string, password: string) => {
  return axiosInstance
    .post("/api/auth/login", { email, password })
    .then((res) => res.data);
};

export const register = (username: string, email: string, password: string) => {
  return axiosInstance
    .post("/api/auth/register", { username, email, password })
    .then((res) => res.data);
};

export const verifyOtp = (email: string, otp: string, purpose: string) => {
  return axiosInstance
    .post("/api/auth/verify-otp", { email, otp, purpose })
    .then((res) => res.data);
};

export const resetPassword = (token: string, password: string) => {
  return axiosInstance
    .post("/api/auth/reset-password", { token, password })
    .then((res) => res.data);
};

export const forgotPassword = (email: string) => {
  return axiosInstance
    .post("/api/auth/forget-password", { email })
    .then((res) => res.data);
};

export const getUsers = (page: number = 1, limit: number = 10,search: string = "") => {
   let url = `/api/super-admin/get-users?page=${page}&limit=${limit}`;
   if(search){
    url+=`&search=${encodeURIComponent(search)}`;
   }
  return axiosInstance
    .get(url)
    .then((res) => res.data);
};

export const worspaceAdminGetUsers = (page: number = 1, limit: number = 10,search: string = "") => {
 let url = `/api/workspaceadmin/get-users?page=${page}&limit=${limit}`;
   if(search){
    url+=`&search=${encodeURIComponent(search)}`;
   }
  return axiosInstance
    .get(url)
    .then((res) => res.data);
};
export const moderatorGetUsers = (page: number = 1, limit: number = 10,search: string = "") => {
  let url = `/api/moderator/get-users?page=${page}&limit=${limit}`;
   if(search){
    url+=`&search=${encodeURIComponent(search)}`;
   }
  return axiosInstance
    .get(url)
    .then((res) => res.data);
};

export const resendOtp = (email: string) => {
  return axiosInstance
    .post("/api/auth/resend-otp", { email })
    .then((res) => res.data);
};

export const logout = () => {
  return axiosInstance.post("/api/auth/logout");
};
