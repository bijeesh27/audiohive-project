import { BaseRepository } from "../../../shared/common/baseRepository";
import { IroomRepository } from "../domain/IroomRepository";
import { IRoomDocument, RoomModel } from "./roomSchema";
import { ClientSession, FilterQuery } from "mongoose";
import { UserRoles } from "../../../common/constant/userRoles";
import { UserModel } from "../../../shared/User.utils/userSchema";
import { AppError } from "../../../common/Errors/AppError";
import { HttpStatus } from "../../../common/constant/httpStatus";

export class RoomRepository
  extends BaseRepository<IRoomDocument>
  implements IroomRepository {
  constructor() {
    super(RoomModel);
  }

  async createRoom(data: Partial<IRoomDocument>, session?: ClientSession): Promise<IRoomDocument> {
    if (session) {
      const created = await this.model.create([data as IRoomDocument], { session });
      return created[0];
    }
    return await this.model.create(data as IRoomDocument);
  }

  async updateRoom(
    roomId: string,
    workspaceId: string,
    data: Partial<IRoomDocument>
  ): Promise<void> {
    await this.model.updateOne(
      { _id: roomId, workspaceId },
      { $set: data }
    );
  }

  async deleteRoom(roomId: string, workspaceId: string): Promise<void> {
    const room = await this.model.findOne({ _id: roomId, workspaceId });
    if (room?.isDefault || room?.name === "Lounge" || room?.name === "Office Common Room") {
      throw new AppError("System default rooms (Lounge, Office Common Room) cannot be deleted", HttpStatus.FORBIDDEN);
    }
    await this.model.deleteOne({
      _id: roomId,
      workspaceId,
    });
  }

  async findRoom(roomId: string): Promise<IRoomDocument | null> {
    return await this.model.findById(roomId);
  }

  async findDefaultRoom(workspaceId: string): Promise<IRoomDocument | null> {
    return await this.model.findOne({ workspaceId, isDefault: true });
  }

  async countNonDefaultRooms(workspaceId: string): Promise<number> {
    return await this.model.countDocuments({ workspaceId, isDefault: { $ne: true } });
  }

  async getAllRooms(
    workspaceId: string,
    page: number,
    limit: number,
    search?: string,
    userId?: string,
    role?: string,
    type?: string,
    status?: string
  ): Promise<{ rooms: IRoomDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IRoomDocument> = { workspaceId };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (type && type !== "all") {
      if (type === "lounge") {
        query.$or = [{ type: "lounge" }, { isDefault: true }, { name: "Lounge" }];
      } else if (type === "public") {
        query.type = "public";
      } else if (type === "private") {
        query.type = "private";
      }
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (role === UserRoles.MEMBER && userId) {
      query.$or = [
        { type: "public" },
        { type: "lounge" },
        { isDefault: true },
        { isPrivate: false },
        { type: "private", allowedUsers: userId }
      ];
    }

    const [rooms, total] = await Promise.all([
      this.model.find(query).skip(skip).limit(limit).sort({ isDefault: -1, createdAt: -1 }),
      this.model.countDocuments(query),
    ]);

    return { rooms, total };
  }

  async updateAllowedUsers(roomId: string, workspaceId: string, userIds: string[]): Promise<void> {
    await this.model.updateOne(
      { _id: roomId, workspaceId },
      { $set: { allowedUsers: userIds } }
    );
  }

  async getRoomParticipants(
    roomId: string,
    workspaceId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ participants: { _id: string; username: string; email: string; role: string; status: boolean }[]; total: number }> {
    const room = await this.model.findOne({ _id: roomId, workspaceId })
      .populate<{
        allowedUsers: { _id: string; username: string; email: string; role: string; status: boolean; createdAt?: Date }[];
      }>("allowedUsers", "username email role status createdAt")
      .populate<{
        createdBy: { _id: string; username: string; email: string; role: string; status: boolean; createdAt?: Date };
      }>("createdBy", "username email role status createdAt");

    if (!room) {
      return { participants: [], total: 0 };
    }

    type Participant = { _id: string; username: string; email: string; role: string; status: boolean; createdAt?: Date };
    let users: Participant[];

    const ownerId = room?.createdBy?._id?.toString() || (typeof room?.createdBy === "string" ? room?.createdBy : "");

    const isPublicOrLounge =
      room.type === "public" ||
      room.type === "lounge" ||
      room.isDefault ||
      room.name === "Office Common Room" ||
      room.name === "Lounge";

    if (isPublicOrLounge) {
      // Return ALL workspace users (members and workspace admins), resolving the presence vs participants disconnect
      const workspaceMembers = await UserModel.find({
        $or: [{ workspaceIds: workspaceId }, { workspaceId }],
      })
        .select("_id username email role status createdAt")
        .sort({ username: 1 })
        .lean();

      users = workspaceMembers.map((user) => ({
        _id: user._id?.toString() ?? "",
        username: user.username,
        email: user.email,
        role: user._id?.toString() === ownerId ? "owner" : (user.role ?? UserRoles.MEMBER),
        status: user.status ?? true,
        createdAt: (user as any).createdAt,
      }));
    } else {
      const userMap = new Map<string, Participant>();

      (room.allowedUsers ?? []).forEach((user) => {
        const uid = user._id.toString();
        userMap.set(uid, {
          _id: uid,
          username: user.username,
          email: user.email,
          role: uid === ownerId ? "owner" : (user.role ?? UserRoles.MEMBER),
          status: user.status ?? true,
          createdAt: (user as any).createdAt,
        });
      });

      if (room?.createdBy && typeof room.createdBy === "object" && room.createdBy._id) {
        const creatorId = room.createdBy._id.toString();
        if (!userMap.has(creatorId)) {
          userMap.set(creatorId, {
            _id: creatorId,
            username: room.createdBy.username,
            email: room.createdBy.email,
            role: "owner",
            status: room.createdBy.status ?? true,
            createdAt: room.createdBy.createdAt,
          });
        }
      }

      users = Array.from(userMap.values());
    }

    if (search) {
      const lower = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.username.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower)
      );
    }

    const total = users.length;
    const skip = (page - 1) * limit;
    const participants = users.slice(skip, skip + limit);

    return { participants, total };
  }

  async removeRoomUser(roomId: string, workspaceId: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: roomId, workspaceId },
      { $pull: { allowedUsers: userId } }
    );
  }
}
