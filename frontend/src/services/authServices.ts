

import axiosInstance from "../config/axios"



export const login=(email:string,password:string)=>{
    
    return axiosInstance.post('/api/auth/login',{email,password})
    .then(res=>res.data )
    .then(data=>{

        return data
    })
    
}

  export const register=async(username:string,email:string,password:string)=>{
    return axiosInstance.post('/api/auth/register',{username,email,password})
    .then(res=>res.data)
    .then(data=>{
        return data
    })
  }

  export const verifyOtp=async(otp:string,purpose:string)=>{
    return axiosInstance.post('/api/auth/verify-otp',{otp,purpose})
    .then(res=>res.data)
    .then(data=>{
        return data
    })
  }

  export const getUsers=async(accessToken:string|null)=>{
    return await axiosInstance.get('/api/super-admin/get-users',{
        headers:{
              Authorization: `Bearer ${accessToken}`,
        }
    })
    .then(res=>{
        console.log(res)
        return res.data
    })
  }