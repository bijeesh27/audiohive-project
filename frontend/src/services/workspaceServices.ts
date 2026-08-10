import axiosInstance from "../config/axios"


export const getAllWorkspaces=()=>{
    return axiosInstance.get('/api/workspace/getallworkspaces').then(res=>res.data)
}

export const createWorkspace=(data:any)=>{
    return axiosInstance.post("/api/workspace/createworkspace",data).then(res=>res.data)
}

export const updateWorkspace=(workspaceId:string,data:any)=>{
    return axiosInstance.put(`/api/workspace/updateworkspace/${workspaceId}`,data).then(res=>res.data)
}