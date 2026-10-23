import { UserRoles } from "../../../common/constant/userRoles.ts";
import { UserModel } from "../../../shared/User.utils/userSchema.ts";
import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";
import { IuserRepository } from "../domain/IuserRepository.ts";
import { RoomModel } from "../../room/infrastructure/roomSchema.ts";
import { getUserWorkspaceIds } from "../../../shared/User.utils/workspaceMembership.ts";
import { socketService } from "../../../socket/socketService.ts";

const workspaceMembershipQuery = (workspaceId: string) => ({
  $or: [
    { workspaceIds: workspaceId },
    { workspaceId },
  ],
});

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
      ...workspaceMembershipQuery(workspaceId),
    };
    if (searchQuery) {
      query.$and = [{ $or: [
        { username: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
      ] }];
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
      UserModel.countDocuments({
        role: UserRoles.MEMBER,
        ...workspaceMembershipQuery(workspaceId),
      }),
    ]);
    return { totalRooms, totalUsers };
  }
  async getActiveUsers(workspaceId: string): Promise<number> {
    return await UserModel.countDocuments({
      status: true,
      role: UserRoles.MEMBER,
      ...workspaceMembershipQuery(workspaceId),
    });
  }

  async updateUser(userId: string, data: Partial<IuserDTO>): Promise<IuserDTO> {
    const updated = await UserModel.findByIdAndUpdate(userId, { $set: data }, { new: true }).select("-password");
    return updated as IuserDTO;
  }

  async updateUserInWorkspace(
    userId: string,
    workspaceId: string,
    data: Partial<IuserDTO>,
  ): Promise<IuserDTO | null> {
    return (await UserModel.findOneAndUpdate(
      { _id: userId, ...workspaceMembershipQuery(workspaceId) },
      { $set: data },
      { new: true },
    ).select("-password")) as IuserDTO | null;
  }

  async findUserById(userId: string): Promise<IuserDTO | null> {
    return (await UserModel.findById(userId).select("-password")) as IuserDTO | null;
  }

  async setUserWorkspaceIds(
    userId: string,
    workspaceIds: string[],
  ): Promise<IuserDTO | null> {
    const currentUser = await UserModel.findById(userId).select("workspaceIds workspaceId");
    if (!currentUser) return null;

    const nextIds = Array.from(new Set(workspaceIds));
    const removedIds = getUserWorkspaceIds(currentUser).filter((id) => !nextIds.includes(id));

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: { workspaceIds: nextIds },
        $unset: { workspaceId: 1 },
      },
      { new: true },
    ).select("-password");

    if (removedIds.length > 0) {
      await RoomModel.updateMany(
        { workspaceId: { $in: removedIds }, allowedUsers: userId },
        { $pull: { allowedUsers: userId } },
      );
      await socketService.disconnectUserFromWorkspaces(userId, removedIds);
    }

    return updated as IuserDTO | null;
  }

  async removeUserFromWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<IuserDTO | null> {
    const user = await this.findUserById(userId);
    if (!user || !getUserWorkspaceIds(user).includes(workspaceId)) return null;

    return this.setUserWorkspaceIds(
      userId,
      getUserWorkspaceIds(user).filter((id) => id !== workspaceId),
    );
  }
}

