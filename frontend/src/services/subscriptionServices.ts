
import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface SubscriptionDTO {
  _id?: string;
  subscriptionName: string;
  price: number;
  description: string;
  maxRooms: number;
  maxUsers: number;
  features: string[];
  isActive?: boolean;
}

export const subscriptionService = {
  getAllSubscriptions: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.SUBSCRIPTION.GET_ALL);
    return response.data;
  },

  createSubscription: async (data: SubscriptionDTO) => {
    const response = await axiosInstance.post(API_ENDPOINTS.SUBSCRIPTION.CREATE, data);
    return response.data;
  },

  updateSubscription: async (subscriptionId: any, data: SubscriptionDTO) => {
    const response = await axiosInstance.post(API_ENDPOINTS.SUBSCRIPTION.UPDATE, {
      subscriptionId,
      data,
    });
    return response.data;
  },

  deleteSubscription: async (id: string) => {
    const response = await axiosInstance.post(API_ENDPOINTS.SUBSCRIPTION.DELETE, { id });
    return response.data;
  },
};