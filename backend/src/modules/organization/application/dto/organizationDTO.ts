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

export interface GetOrganizationUsersDTO {
  ownerEmail: string;
  page: number;
  limit: number;
  search?: string;
}

export interface GetOrganizationUsersResultDTO {
  users: IuserDocument[];
  total: number;
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
