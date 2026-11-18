export interface GetSuperAdminUsersFilterDTO {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string; // "active" | "disabled" | "all"
  presence?: string; // "online" | "offline" | "all"
  organizationId?: string;
  workspaceId?: string;
  sort?: "newest" | "oldest" | "name" | "lastActive";
}

export interface SuperAdminUserItemDTO {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  isOnline: boolean;
  lastActiveAt: string | null;
  joinedAt: string;
  organization: {
    _id: string;
    companyName: string;
    slug: string;
  } | null;
  workspaces: Array<{
    _id: string;
    workspaceName: string;
  }>;
  isOwner: boolean;
  isSoleAdmin: boolean;
  soleAdminWorkspaceNames?: string[];
}

export interface SuperAdminUsersStatsDTO {
  totalUsers: number;
  ownersCount: number;
  membersCount: number;
  onlineCount: number;
}

export interface SuperAdminUsersResponseDTO {
  users: SuperAdminUserItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: SuperAdminUsersStatsDTO;
  filterOptions: {
    organizations: Array<{ _id: string; companyName: string; slug: string }>;
    workspaces: Array<{ _id: string; workspaceName: string; organizationId?: string }>;
  };
}

export interface UpdateUserStatusDTO {
  targetUserId: string;
  status: boolean;
  actorId: string;
  actorEmail?: string;
}
