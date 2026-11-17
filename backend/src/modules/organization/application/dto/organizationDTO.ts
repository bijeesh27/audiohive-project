import { IuserDocument } from "../../../../shared/User.utils/userSchema";
import { IorganizationDocument } from "../../infrastructure/organizationSchema";

export interface CreateOrganizationDTO {
  companyName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  actorId?: string | null;
  workspaceId?: string;
  organizationId?: string;
}

export interface UpdateOrganizationFieldsDTO {
  companyName?: string;
  slug?: string;
}

export interface UpdateOrganizationDTO {
  organizationId: string;
  data: UpdateOrganizationFieldsDTO;
}

export interface DeleteOrganizationDTO {
  organizationId: string;
}

export interface GetAllOrganizationsDTO {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
}

export interface GetAllOrganizationsResultDTO {
  organizations: IorganizationDocument[];
  total: number;
}

export interface GetMyOrganizationDTO {
  ownerEmail: string;
}

export interface OrganizationUserItemDTO {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  isOnline: boolean;
  roomsCount: number;
  lastActiveAt: string | null;
  joinedAt: string;
  workspaceIds?: Array<string | { _id: string; workspaceName: string }>;
  workspaceId?: string | { _id: string; workspaceName: string };
  workspaces?: Array<{ _id: string; workspaceName: string }>;
  isSoleAdmin?: boolean;
  soleAdminWorkspaceNames?: string[];
  isOwner?: boolean;
}

export interface GetOrganizationUsersDTO {
  ownerEmail: string;
  page?: number;
  limit?: number;
  search?: string;
  workspaceId?: string;
  role?: string;
  status?: string;
  presence?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetOrganizationUsersResultDTO {
  users: OrganizationUserItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  metrics: {
    totalMembers: number;
    planLimit: number | null;
    planName?: string;
  };
}

export interface UpdateOrgUserStatusDTO {
  ownerEmail: string;
  actorId: string;
  userId: string;
  status: boolean;
}

export interface UpdateOrgUserRoleDTO {
  ownerEmail: string;
  actorId: string;
  userId: string;
  role: string;
}

export interface RemoveOrgUserDTO {
  ownerEmail: string;
  actorId: string;
  userId: string;
}

export interface SetUserWorkspacesDTO {
  ownerEmail: string;
  userId: string;
  workspaceIds: string[];
  actorId: string;
}

export interface GetOrgDashboardStatsDTO {
  ownerEmail: string;
}

export interface OrgDashboardStatsDTO {
  totalWorkspaces: number;
  totalUsers: number;
}

export interface SendOrganizationInvitationDTO {
  ownerEmail: string;
  companyName: string;
  slug: string;
  ownerName: string;
  planId?: string;
  actorId?: string | null;
  workspaceId?: string;
  organizationId?: string;
}
