export interface createSubscriptionDTO {
  subscriptionName: string;
  price: number;
  description: string;
  maxRooms: number;
  maxUsers: number;
  features: string[];
}
export interface updateSubscriptionDTO {
  id?: string;
  subscriptionName?: string;
  price?: number;
  description?: string;
  maxRooms?: number;
  maxUsers?: number;
  features?: string[];
}

export interface deleteSubscriptionDTO {
  id: string;
}

export interface AllSubscriptionsDTO{
  id: string;
  subscriptionName: string;
  price: number;
  description: string;
  maxRooms: number;
  maxUsers: number;
  features: string[];
}
