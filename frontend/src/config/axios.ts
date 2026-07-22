import axios from "axios";

const axiosInstance=axios.create({
    baseURL:'http://localhost:3000',
    withCredentials:true,
    headers:{
        'Content-Type':'application/json'
    }

})

let accessToken: string | null = null;

export const setToken = (token: string | null) => {
    accessToken = token;
};

axiosInstance.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

export default axiosInstance