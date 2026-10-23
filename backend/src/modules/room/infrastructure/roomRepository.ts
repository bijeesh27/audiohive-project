import { BaseRepository } from "../../../shared/common/baseRepository";
import { IroomRepository } from "../domain/IroomRepository";
import { IRoomDocument, RoomModel } from "./roomSchema";
import { FilterQuery } from "mongoose";
import { UserRoles } from "../../../common/constant/userRoles";
import { UserModel } from "../../../shared/User.utils/userSchema";

export class RoomRepository
  extends BaseRepository<IRoomDocument>
  implements IroomRepository
{
  constructor() {
    super(RoomModel);
  }

  async createRoom(data: IRoomDocument): Promise<IRoomDocument> {
   return await this.model.create(data);
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
    await this.model.deleteOne({
      _id: roomId,
      workspaceId,
    });
  }
  async findRoom(roomId: string): Promise<IRoomDocument | null> {
    return await this.model.findById(roomId);
  }

  async getAllRooms(workspaceId: string, page: number, limit: number, search?: string, userId?: string, role?: string): Promise<{ rooms: IRoomDocument[], total: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IRoomDocument> = { workspaceId };
    
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (role === UserRoles.MEMBER && userId) {
      query.$or = [
        { type: "public" },
        { type: "private", allowedUsers: userId }
      ];
    }

    const [rooms, total] = await Promise.all([
      this.model.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
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
    const room = await this.model.findOne({ _id: roomId, workspaceId }).populate<{
      allowedUsers: { _id: string; username: string; email: string; role: string; status: boolean }[];
    }>("allowedUsers", "username email role status");

    type Participant = { _id: string; username: string; email: string; role: string; status: boolean };
    let users: Participant[] = [];

    if (room?.type === "public") {
      const workspaceMembers = await UserModel.find({
        role: UserRoles.MEMBER,
        $or: [{ workspaceIds: workspaceId }, { workspaceId }],
      })
        .select("_id username email role status")
        .sort({ username: 1 })
        .lean();

      users = workspaceMembers.map((user) => ({
        _id: user._id?.toString() ?? "",
        username: user.username,
        email: user.email,
        role: user.role ?? UserRoles.MEMBER,
        status: user.status ?? true,
      }));
    } else {
      users = (room?.allowedUsers ?? []).map((user) => ({
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role ?? UserRoles.MEMBER,
        status: user.status ?? true,
      }));
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
