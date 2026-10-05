import axiosInstance from "../config/axios"


export const recordActivityLog=async(data)=>{
    return axiosInstance.post('/api/activitylog/record',data).then((res)=>res.data)
    
}