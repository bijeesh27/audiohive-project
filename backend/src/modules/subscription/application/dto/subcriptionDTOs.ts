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

export interface MetricLimitUsage {
  current: number;
  limit: number | null;
  percent: number;
  isUnlimited: boolean;
  status: "normal" | "warning" | "exceeded";
}

export interface MySubscriptionResponseDTO {
  organization: {
    id: string;
    companyName: string;
    ownerName: string;
    ownerEmail: string;
    status: string;
    planId: string;
    createdAt: string;
  };
  currentPlan: {
    _id: string;
    subscriptionName: string;
    price: number;
    description: string;
    maxWorkspaces: number;
    maxRooms?: number;
    features: string[];
    isActive: boolean;
    stripePriceId?: string;
  };
  usage: {
    workspaces: MetricLimitUsage;
    rooms: MetricLimitUsage;
    members: MetricLimitUsage;
  };
  availablePlans: Array<{
    _id: string;
    subscriptionName: string;
    price: number;
    description: string;
    maxWorkspaces: number;
    maxRooms?: number;
    features: string[];
    isActive: boolean;
    stripePriceId?: string;
  }>;
}

export interface UpgradeSubscriptionDTO {
  ownerEmail: string;
  targetPlanId: string;
}

export interface UpgradeSubscriptionResponseDTO {
  directUpdate: boolean;
  checkoutUrl?: string;
  plan?: unknown;
  message?: string;
}

export interface VerifyUpgradeDTO {
  ownerEmail: string;
  sessionId: string;
}

export interface VerifyUpgradeResponseDTO {
  success: boolean;
  message: string;
  plan?: unknown;
}
