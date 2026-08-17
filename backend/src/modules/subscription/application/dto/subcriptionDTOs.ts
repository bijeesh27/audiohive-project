export interface createSubscriptionDTO {
  subscriptionName: string;
  price: number;
  description: string;
  maxWorkspaces: number;
  features: string[];
  isActive?: boolean;
}
export interface updateSubscriptionDTO {
  id?: string;
  subscriptionName?: string;
  price?: number;
  description?: string;
  maxWorkspaces?: number;
  features?: string[];
  isActive?: boolean;
}

export interface deleteSubscriptionDTO {
  id: string;
}

export interface AllSubscriptionsDTO{
  id: string;
  subscriptionName: string;
  price: number;
  description: string;
  maxWorkspaces: number;
  features: string[];
  isActive?: boolean;
}
