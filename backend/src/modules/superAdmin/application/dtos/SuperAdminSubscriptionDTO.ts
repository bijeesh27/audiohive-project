export interface SuperAdminPlanDTO {
  _id: string;
  subscriptionName: string;
  key: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  description: string;
  maxWorkspaces: number;
  maxRooms: number;
  features: string[];
  isActive: boolean;
  status: "active" | "inactive" | "archived";
  isDefault: boolean;
  isRecommended: boolean;
  displayOrder: number;
  subscriberCount: number;
  activeSubscriberCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrUpdatePlanDTO {
  subscriptionName: string;
  key?: string;
  price: number;
  currency?: string;
  interval?: "month" | "year";
  description: string;
  maxWorkspaces: number;
  maxRooms?: number;
  features: string[];
  isDefault?: boolean;
  isRecommended?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  status?: "active" | "inactive" | "archived";
}

export interface PlanImpactCheckResultDTO {
  canSave: boolean;
  subscriberCount: number;
  affectedOrganizations: Array<{
    _id: string;
    companyName: string;
    slug: string;
    currentWorkspaces: number;
    allowedWorkspaces: number;
    exceededBy: number;
  }>;
  warningMessage?: string;
}

export interface SuperAdminSubscriptionsFilterDTO {
  page?: number;
  limit?: number;
  search?: string;
  planId?: string;
  status?: string;
  nearLimit?: boolean;
  sort?: "newest" | "oldest" | "name" | "workspaces";
}

export interface SuperAdminSubscriptionItemDTO {
  organizationId: string;
  companyName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  orgStatus: "active" | "suspended" | "pending" | "archived";
  plan: {
    _id: string;
    subscriptionName: string;
    price: number;
    currency: string;
    interval: string;
    maxWorkspaces: number;
  };
  startedAt: string;
  workspacesCount: number;
  nearLimit: boolean;
  usagePercent: number;
}

export interface SuperAdminSubscriptionsResponseDTO {
  subscriptions: SuperAdminSubscriptionItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filterOptions: {
    plans: Array<{ _id: string; subscriptionName: string; price: number }>;
  };
}
