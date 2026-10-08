export interface CreateSubscriptionDTO {
  subscriptionName: string;
  price: number;
  description: string;
  maxWorkspaces: number;
  features: string[];
  isActive?: boolean;
}

export interface UpdateSubscriptionDTO {
  id: string;
  subscriptionName?: string;
  price?: number;
  description?: string;
  maxWorkspaces?: number;
  features?: string[];
  isActive?: boolean;
}

export interface DeleteSubscriptionDTO {
  id: string;
}

export interface CreateCheckoutSessionDTO {
  planId: string;
  ownerEmail?: string;
  companyName?: string;
  slug?: string;
  ownerName?: string;
}

export interface VerifyCheckoutSessionDTO {
  sessionId: string;
}

export interface VerifyCheckoutSessionResultDTO {
  status: string;
  ownerEmail: string;
  companyName: string;
  slug: string;
  ownerName: string;
  planId: string;
}
