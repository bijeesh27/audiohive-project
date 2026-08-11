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

// Add this new function
export const approveWorkspaceApi = (data: { workspaceId: string, adminEmail: string, workspaceName: string }) => {
    // Make sure the URL matches whatever your superadmin base route is in your backend
    return axiosInstance.post("/api/super-admin/approve-workspace", data).then(res => res.data);
}