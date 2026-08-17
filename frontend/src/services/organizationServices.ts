import axiosInstance from "../config/axios"


export const createOrganization=async(data:any)=>{
    await axiosInstance.post('/api/organization/create-organization',data).then(res=>res.data)
}

export const getAllOrganizations=async(page:any,limit:any,search:any)=>{
    return await axiosInstance.get('/api/organization/getall-organizations', {
        params: { page, limit, search }
    }).then(res=>res.data)
}

export const updateOrganization = async (id: string, data: any) => {
    return await axiosInstance.post(`/api/organization/update-organization/${id}`, data).then(res => res.data);
}

export const getMyOrganization = async () => {
    return await axiosInstance.get('/api/organization/my-organization').then(res => res.data);
}