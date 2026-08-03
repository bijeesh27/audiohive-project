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

export const getUsers = () => {
  return axiosInstance
    .get("/api/super-admin/get-users")
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
