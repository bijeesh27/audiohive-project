import { UserRoles } from "../../../common/constant/userRoles.ts";
import { UserModel } from "../../../shared/User.utils/userSchema.ts";
import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";
import { IuserRepository } from "../domain/IuserRepository.ts";
import { RoomModel } from "../../room/infrastructure/roomSchema.ts";

export class UserRepository implements IuserRepository {
  async getAllUsers(
    workspaceId: string,
    page: number,
    limit: number,
    searchQuery?: string,
  ): Promise<{ users: Array<IuserDTO>; total: number } | null> {
    const skip = (page - 1) * limit;

    const query: Record<string, unknown>  = {
      role: { $in: [UserRoles.MEMBER] },
      workspaceId: workspaceId,
    };
    if (searchQuery) {
      query.$or = [
        { username: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      UserModel.find(query).select("-password").skip(skip).limit(limit),
      UserModel.countDocuments(query),
    ]);

    return { users, total };
  }

  async getDashboardStats(workspaceId: string): Promise<import("../application/dtos/workspaceAdminDTO.ts").WorkspaceDashboardStatsDTO> {
    const [totalRooms, totalUsers] = await Promise.all([
      RoomModel.countDocuments({ workspaceId }),
      UserModel.countDocuments({ workspaceId, role: UserRoles.MEMBER }),
    ]);
    return { totalRooms, totalUsers };
  }
  async getActiveUsers(workspaceId: string): Promise<number> {
    return await UserModel.countDocuments({ status: true, workspaceId });
  }

  async updateUser(userId: string, data: Partial<IuserDTO>): Promise<IuserDTO> {
    if (data.workspaceId === null) {
      await RoomModel.updateMany(
        { allowedUsers: userId },
        { $pull: { allowedUsers: userId } }
      );
    }
    const updated = await UserModel.findByIdAndUpdate(userId, { $set: data }, { new: true }).select("-password");
    return updated as IuserDTO;
  }
}

