import { Types } from "mongoose";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { UserModel } from "../../../shared/User.utils/userSchema.ts";
import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";
import { IuserRepository } from "../domain/IuserRepository.ts";
import { RoomModel } from "../../room/infrastructure/roomSchema.ts";
import { ActivityLogModel } from "../../activityLog/infrastructure/activitylogSchema.ts";
import {
  getUserWorkspaceIds,
  buildWorkspaceMembershipQuery,
  buildWorkspaceMemberFilter,
} from "../../../shared/User.utils/workspaceMembership.ts";
import { socketService } from "../../../socket/socketService.ts";
import {
  GetAllUsersQueryDTO,
  GetAllUsersResponseDTO,
  WorkspaceMemberRecordDTO,
} from "../application/dtos/workspaceAdminDTO.ts";

export class UserRepository implements IuserRepository {
  async getAllUsers(
    paramsOrWorkspaceId: GetAllUsersQueryDTO | string,
    pageArg?: number,
    limitArg?: number,
    searchArg?: string
  ): Promise<GetAllUsersResponseDTO | null> {
    const params: GetAllUsersQueryDTO =
      typeof paramsOrWorkspaceId === "string"
        ? {
            workspaceId: paramsOrWorkspaceId,
            page: pageArg || 1,
            limit: limitArg || 10,
            search: searchArg,
          }
        : paramsOrWorkspaceId;

    const {
      workspaceId,
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sortField = "joined",
      sortOrder = "desc",
    } = params;

    // 1. Fetch workspace rooms to calculate room access
    const workspaceRooms = await RoomModel.find({
      $or: [
        { workspaceId },
        ...(Types.ObjectId.isValid(workspaceId) ? [{ workspaceId: new Types.ObjectId(workspaceId) }] : []),
      ],
    })
      .select("_id type allowedUsers")
      .lean();

    // 2. Fetch workspace activity logs to calculate lastActiveAt
    const activities = await ActivityLogModel.find({
      workspaceId,
    })
      .select("actorId occurredAt")
      .sort({ occurredAt: -1 })
      .lean();

    const userLastActiveMap = new Map<string, Date>();
    for (const act of activities) {
      if (!act.actorId) continue;
      const aId = act.actorId.toString();
      if (!userLastActiveMap.has(aId)) {
        userLastActiveMap.set(aId, new Date(act.occurredAt));
      }
    }

    // 3. Fetch all workspace members
    const allWorkspaceMembers = await UserModel.find(buildWorkspaceMemberFilter(workspaceId))
      .select("-password")
      .lean();

    // Calculate stat chip totals across all workspace members (unfiltered)
    let totalOnline = 0;
    let totalActive = 0;
    let totalDisabled = 0;

    for (const u of allWorkspaceMembers) {
      const uId = u._id.toString();
      const isOnline = socketService.isUserOnline(uId);
      if (isOnline) totalOnline += 1;
      if (u.status !== false) {
        totalActive += 1;
      } else {
        totalDisabled += 1;
      }
    }

    const stats = {
      total: allWorkspaceMembers.length,
      online: totalOnline,
      active: totalActive,
      disabled: totalDisabled,
    };

    // 4. Map each member to an enriched record
    const allRecords: WorkspaceMemberRecordDTO[] = allWorkspaceMembers.map((u) => {
      const uId = u._id.toString();
      const lastActive = userLastActiveMap.get(uId) || (u as { updatedAt?: Date }).updatedAt || null;
      const roomsCount = workspaceRooms.filter((r) => {
        if (r.type === "public") return true;
        return Array.isArray(r.allowedUsers) && r.allowedUsers.some((id: unknown) => id && String(id) === uId);
      }).length;

      return {
        _id: uId,
        userId: uId,
        username: u.username,
        email: u.email,
        role: u.role || UserRoles.MEMBER,
        status: u.status !== false,
        isOnline: socketService.isUserOnline(uId),
        roomsCount,
        lastActiveAt: lastActive ? new Date(lastActive).toISOString() : null,
        joinedAt: (u as { createdAt?: Date }).createdAt
          ? new Date((u as { createdAt?: Date }).createdAt!).toISOString()
          : new Date().toISOString(),
        workspaceIds: u.workspaceIds,
        workspaceId: u.workspaceId,
      };
    });

    // 5. Apply filtering (search, role, status)
    let filtered = allRecords;

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(
        (m) => m.username.toLowerCase().includes(term) || m.email.toLowerCase().includes(term)
      );
    }

    if (role && role !== "all") {
      filtered = filtered.filter((m) => m.role.toLowerCase() === role.toLowerCase());
    }

    if (status && status !== "all") {
      if (status === "active") {
        filtered = filtered.filter((m) => m.status === true);
      } else if (status === "disabled") {
        filtered = filtered.filter((m) => m.status === false);
      }
    }

    // 6. Apply sorting
    const multiplier = sortOrder === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      switch (sortField) {
        case "name":
        case "username":
          return multiplier * a.username.localeCompare(b.username);
        case "role":
          return multiplier * a.role.localeCompare(b.role);
        case "status":
          return multiplier * (Number(a.status) - Number(b.status));
        case "rooms":
        case "roomsCount":
          return multiplier * (a.roomsCount - b.roomsCount);
        case "lastActive":
        case "lastActiveAt": {
          const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          return multiplier * (timeA - timeB);
        }
        case "joined":
        case "joinedAt":
        default: {
          const timeA = new Date(a.joinedAt).getTime();
          const timeB = new Date(b.joinedAt).getTime();
          return multiplier * (timeA - timeB);
        }
      }
    });

    // 7. Pagination
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;
    const paginatedUsers = filtered.slice(skip, skip + limit);

    return {
      users: paginatedUsers,
      total,
      page,
      totalPages,
      stats,
    };
  }

  async getDashboardStats(workspaceId: string): Promise<import("../application/dtos/workspaceAdminDTO.ts").WorkspaceDashboardStatsDTO> {
    const [totalRooms, totalUsers] = await Promise.all([
      RoomModel.countDocuments({
        $or: [
          { workspaceId },
          ...(Types.ObjectId.isValid(workspaceId) ? [{ workspaceId: new Types.ObjectId(workspaceId) }] : []),
        ],
      }),
      UserModel.countDocuments(buildWorkspaceMemberFilter(workspaceId)),
    ]);
    return { totalRooms, totalUsers };
  }

  async getActiveUsers(workspaceId: string): Promise<number> {
    return await UserModel.countDocuments({
      status: true,
      ...buildWorkspaceMemberFilter(workspaceId),
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
      { _id: userId, ...buildWorkspaceMembershipQuery(workspaceId) },
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

