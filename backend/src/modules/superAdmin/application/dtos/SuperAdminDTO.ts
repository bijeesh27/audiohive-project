import { IuserDTO } from "../../../../shared/User.utils/userDTO.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";

export interface GetAllUsersDTO {
  page: number;
  limit: number;
  search?: string;
}

export interface GetAllUsersResultDTO {
  users: IuserDocument[];
  total: number;
}

export interface ApproveWorkspaceDTO {
  workspaceId: string;
  adminEmail: string;
  workspaceName: string;
  workspaceAdminName: string;
}

export interface UpdateUserDTO {
  userId: string;
  updateData: Partial<IuserDTO>;
}

export interface SuperAdminDashboardStatsDTO {
  totalOrganizations: number;
  totalUsers: number;
}
