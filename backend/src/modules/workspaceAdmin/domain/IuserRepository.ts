import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";


export interface IuserRepository {
  getAllUsers(workspaceId: string, page: number, limit: number, searchQuery?: string): Promise<{ users: Array<IuserDTO>; total: number } | null>;
  getDashboardStats(workspaceId: string): Promise<import("../application/dtos/workspaceAdminDTO.ts").WorkspaceDashboardStatsDTO>;
  getActiveUsers(workspaceId: string): Promise<number>;
  updateUser(userId: string, data: Partial<IuserDTO>): Promise<IuserDTO>;
}

