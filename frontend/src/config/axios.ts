import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000",
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

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/api/auth/refresh"
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post("http://localhost:3000/api/auth/refresh", {
          withCredentials: true,
        });

        if (res.data && res.data.success) {
          const newAccessToken = res.data.data.accessToken;
          setToken(newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
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
