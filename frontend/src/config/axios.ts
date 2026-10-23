import axios from "axios";
import { HttpStatus } from "../constants/httpStatus";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken: string | null = null;

export const setToken = (token: string | null) => {
  accessToken = token;
};

export const getToken = () => accessToken;



axiosInstance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const hasAccessToken = Boolean(
      originalRequest?.headers?.Authorization ?? accessToken,
    );

    if (
      originalRequest &&
      error.response &&
      error.response.status === HttpStatus.UNAUTHORIZED &&
      hasAccessToken &&
      !originalRequest._retry &&
      originalRequest.url !== "/api/auth/refresh" 
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/auth/refresh`,
          {},
          {
            withCredentials: true,
          },
        );

        if (res.data && res.data.success) {
          const newAccessToken = res.data.data.accessToken;
          setToken(newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        setToken(null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
export default axiosInstance;
