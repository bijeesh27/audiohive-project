import axiosInstance from "../config/axios"


export const createOrganization=async(data: Record<string, unknown>)=>{
    await axiosInstance.post('/api/organization/create-organization',data).then(res=>res.data)
}

export const getAllOrganizations=async(page: number, limit: number, search?: string)=>{
    return await axiosInstance.get('/api/organization/getall-organizations', {
        params: { page, limit, search }
    }).then(res=>res.data)
}

export const updateOrganization = async (id: string, data: Record<string, unknown>) => {
    return await axiosInstance.post(`/api/organization/update-organization/${id}`, data).then(res => res.data);
}

export const getMyOrganization = async () => {
    return await axiosInstance.get('/api/organization/my-organization').then(res => res.data);
}

export const getOrgDashboardStats = async () => {
    return await axiosInstance.get('/api/organization/dashboard-stats').then(res => res.data);
}
