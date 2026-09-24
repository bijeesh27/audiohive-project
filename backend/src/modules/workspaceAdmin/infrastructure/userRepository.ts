import { UserRoles } from "../../../common/constant/userRoles.ts";
import {
  IuserDocument,
  UserModel,
} from "../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../domain/IuserRepository.ts";
import { RoomModel } from "../../room/infrastructure/roomSchema.ts";

export class UserRepository implements IuserRepository {
  async getAllUsers(
    workspaceId: string,
    page: number,
    limit: number,
    searchQuery?: string,
  ): Promise<{ users: Array<IuserDocument>; total: number } | null> {
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

  async getDashboardStats(workspaceId: string): Promise<{ totalRooms: number; totalUsers: number }> {
    const [totalRooms, totalUsers] = await Promise.all([
      RoomModel.countDocuments({ workspaceId }),
      UserModel.countDocuments({ workspaceId, role: UserRoles.MEMBER }),
    ]);
    return { totalRooms, totalUsers };
  }
  async getActiveUsers(workspaceId: string): Promise<number> {
    return await UserModel.countDocuments({ status: true, workspaceId });
  }

  async updateUser(userId: string, data: Partial<IuserDocument>): Promise<IuserDocument> {
    if (data.workspaceId === null) {
      await RoomModel.updateMany(
        { allowedUsers: userId },
        { $pull: { allowedUsers: userId } }
      );
    }
    const updated = await UserModel.findByIdAndUpdate(userId, { $set: data }, { new: true }).select("-password");
    return updated as IuserDocument;
  }
}
