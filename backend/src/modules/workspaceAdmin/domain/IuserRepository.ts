import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";
import { GetAllUsersQueryDTO, GetAllUsersResponseDTO } from "../application/dtos/workspaceAdminDTO.ts";

export interface IuserRepository {
  getAllUsers(
    paramsOrWorkspaceId: GetAllUsersQueryDTO | string,
    page?: number,
    limit?: number,
    searchQuery?: string
  ): Promise<GetAllUsersResponseDTO | null>;
  getDashboardStats(workspaceId: string): Promise<import("../application/dtos/workspaceAdminDTO.ts").WorkspaceDashboardStatsDTO>;
  getActiveUsers(workspaceId: string): Promise<number>;
  updateUser(userId: string, data: Partial<IuserDTO>): Promise<IuserDTO>;
  updateUserInWorkspace(userId: string, workspaceId: string, data: Partial<IuserDTO>): Promise<IuserDTO | null>;
  findUserById(userId: string): Promise<IuserDTO | null>;
  setUserWorkspaceIds(userId: string, workspaceIds: string[]): Promise<IuserDTO | null>;
  removeUserFromWorkspace(userId: string, workspaceId: string): Promise<IuserDTO | null>;
}

