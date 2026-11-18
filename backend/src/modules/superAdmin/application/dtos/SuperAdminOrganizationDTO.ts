export interface SuperAdminOrgQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  status?: string;
  nearLimit?: boolean | string;
  sort?: "newest" | "oldest" | "name" | "members" | "lastActivity";
}

export interface EnrichedOrganizationItem {
  _id: string;
  companyName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  status: "active" | "suspended" | "pending" | "archived";
  planId: string;
  planName: string;
  planPrice: number;
  planMissing: boolean;
  workspacesCount: number;
  membersCount: number;
  memberLimit: number | null;
  nearLimit: boolean;
  lastActivity: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminOrgListResponseDTO {
  organizations: EnrichedOrganizationItem[];
  total: number;
  activeCount: number;
  totalAll: number;
  plans: Array<{ id: string; name: string; price: number }>;
}

export interface OrganizationDetailResponseDTO {
  organization: EnrichedOrganizationItem & {
    maxWorkspaces: number;
    maxRooms: number;
    features: string[];
  };
  owner: {
    _id?: string;
    username: string;
    email: string;
    role: string;
    status: boolean;
  } | null;
  kpis: {
    workspacesCount: number;
    membersCount: number;
    memberLimit: number | null;
    onlineNow: number;
    meetings30d: number;
    meetingMinutes30d: number;
    formattedMeetingDuration: string;
  };
  workspaces: Array<{
    _id: string;
    workspaceName: string;
    status: string;
    membersCount: number;
    roomsCount: number;
    createdAt: string;
  }>;
  subscription: {
    planId: string;
    planName: string;
    price: number;
    status: string;
    maxWorkspaces: number;
    features: string[];
    renewalDate: string | null;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    details: string;
    actorName: string;
    timestamp: string;
  }>;
}
