import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";
import {
  GetSuperAdminUsersFilterDTO,
  SuperAdminUsersResponseDTO,
  UpdateUserStatusDTO,
} from "../application/dtos/SuperAdminUsersDTO.ts";

export interface IuserRepository {
  getAllUsers(
    page: number,
    limit: number,
    searchQuery?: string
  ): Promise<{ users: Array<IuserDocument>; total: number } | null>;
  getSuperAdminUsers(
    filter: GetSuperAdminUsersFilterDTO
  ): Promise<SuperAdminUsersResponseDTO>;
  updateUserStatus(dto: UpdateUserStatusDTO): Promise<{ success: boolean; status: boolean }>;
  getTotalOrganizations(): Promise<number>;
  getTotalUsers(): Promise<number>;
}
