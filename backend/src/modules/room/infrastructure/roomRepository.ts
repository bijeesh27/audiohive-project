import { BaseRepository } from "../../../shared/common/baseRepository";
import { IroomRepository } from "../domain/IroomRepository";
import { IRoomDocument, RoomModel } from "./roomSchema";

export class RoomRepository
  extends BaseRepository<IRoomDocument>
  implements IroomRepository
{
  constructor() {
    super(RoomModel);
  }

  async createRoom(data: IRoomDocument): Promise<void> {
    await this.model.create(data);
  }

  async updateRoom(
    roomId: string,
    data: Partial<IRoomDocument>
  ): Promise<void> {
    await this.model.updateOne(
      { _id: roomId },
      { $set: data }
    );
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.model.deleteOne({
      _id: roomId,
    });
  }
  async findRoom(roomId: string): Promise<IRoomDocument | null> {
    return await this.model.findById(roomId);
  }

  async getAllRooms(workspaceId: string, page: number, limit: number, search?: string, userId?: string, role?: string): Promise<{ rooms: IRoomDocument[], total: number }> {
    const skip = (page - 1) * limit;
    const query: any = { workspaceId };
    
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (role === "Member" && userId) {
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

  async updateAllowedUsers(roomId: string, userIds: string[]): Promise<void> {
    await this.model.updateOne(
      { _id: roomId },
      { $set: { allowedUsers: userIds } }
    );
  }

  async getRoomParticipants(
    roomId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ participants: { _id: string; username: string; email: string; role: string; status: boolean }[]; total: number }> {
    const room = await this.model.findById(roomId).populate<{
      allowedUsers: { _id: string; username: string; email: string; role: string; status: boolean }[];
    }>("allowedUsers", "username email role status");

    let users = room?.allowedUsers ?? [];

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

  async removeRoomUser(roomId: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: roomId },
      { $pull: { allowedUsers: userId } }
    );
  }
}