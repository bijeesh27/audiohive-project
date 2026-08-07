import axios from "axios";
const API_URL = "http://localhost:3000/api/subscription";

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
    const response = await axios.get(`${API_URL}/getallsubscriptions`);
    console.log(response.data)
    return response.data;
  },

  createSubscription: async (data: SubscriptionDTO) => {
    const response = await axios.post(`${API_URL}/createsubcription`, data);
    return response.data;
  },

  updateSubscription: async (data: SubscriptionDTO) => {
    const response = await axios.post(`${API_URL}/updatesubscription`, data);
    return response.data;
  },

  deleteSubscription: async (id: string) => {
    const response = await axios.post(`${API_URL}/deletesubscription`, { id });
    return response.data;
  },

};


