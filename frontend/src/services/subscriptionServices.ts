import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface SubscriptionDTO {
  _id?: string;
  subscriptionName: string;
  price: number;
  description: string;
  maxWorkspaces: number;
  maxRooms?: number;
  features: string[];
  isActive?: boolean;
  stripePriceId?: string;
}

export interface MetricLimitUsage {
  current: number;
  limit: number | null;
  percent: number;
  isUnlimited: boolean;
  status: "normal" | "warning" | "exceeded";
}

export interface MySubscriptionData {
  organization: {
    id: string;
    companyName: string;
    ownerName: string;
    ownerEmail: string;
    status: string;
    planId: string;
    createdAt: string;
  };
  currentPlan: SubscriptionDTO;
  usage: {
    workspaces: MetricLimitUsage;
    rooms: MetricLimitUsage;
    members: MetricLimitUsage;
  };
  availablePlans: SubscriptionDTO[];
}

export interface UpgradeResponse {
  directUpdate: boolean;
  checkoutUrl?: string;
  plan?: SubscriptionDTO;
  message?: string;
}

export interface VerifyUpgradeResponse {
  success: boolean;
  plan?: SubscriptionDTO;
  message: string;
}

export const subscriptionService = {
  getAllSubscriptions: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.SUBSCRIPTION.GET_ALL);
    return response.data;
  },

  getMySubscription: async (): Promise<{ success: boolean; data: MySubscriptionData }> => {
    const response = await axiosInstance.get(API_ENDPOINTS.SUBSCRIPTION.GET_MY_SUBSCRIPTION);
    return response.data;
  },

  upgradeSubscription: async (targetPlanId: string): Promise<{ success: boolean; data: UpgradeResponse }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.SUBSCRIPTION.UPGRADE_SUBSCRIPTION, { targetPlanId });
    return response.data;
  },

  verifyUpgrade: async (sessionId: string): Promise<{ success: boolean; data: VerifyUpgradeResponse }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.SUBSCRIPTION.VERIFY_UPGRADE, { sessionId });
    return response.data;
  },

  createSubscription: async (data: SubscriptionDTO) => {
    const response = await axiosInstance.post(API_ENDPOINTS.SUBSCRIPTION.CREATE, data);
    return response.data;
  },

  updateSubscription: async (subscriptionId: string, data: SubscriptionDTO) => {
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
