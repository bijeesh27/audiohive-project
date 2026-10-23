import { BaseRepository } from "../../../shared/common/baseRepository.js";
import { IAnnouncementRepository } from "../domain/IAnnouncementRepository.js";
import { AnnouncementModel } from "./announcementSchema.js";
import { AnnouncementResponseDTO } from "../application/dto/announcementDTO.js";

export class AnnouncementRepository
  extends BaseRepository<AnnouncementResponseDTO>
  implements IAnnouncementRepository
{
  constructor() {
    super(AnnouncementModel);
  }

  async createAnnouncement(
    data: Partial<AnnouncementResponseDTO>
  ): Promise<AnnouncementResponseDTO> {
    const created = await this.model.create(data);
    return created;
  }

  async updateAnnouncement(
    id: string,
    workspaceId: string,
    data: Partial<AnnouncementResponseDTO>
  ): Promise<void> {
    await this.model.updateOne({ _id: id, workspaceId }, { $set: data });
  }

  async deleteAnnouncement(id: string, workspaceId: string): Promise<void> {
    await this.model.deleteOne({ _id: id, workspaceId });
  }

  async findAnnouncement(id: string, workspaceId: string): Promise<AnnouncementResponseDTO | null> {
    return await this.model.findOne({ _id: id, workspaceId }).lean<AnnouncementResponseDTO>();
  }

  async getAllAnnouncements(
    workspaceId: string,
    page: number,
    limit: number,
    status?: string,
    search?: string
  ): Promise<{ announcements: AnnouncementResponseDTO[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { workspaceId };

    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Published + active (not expired)
    query.$or = [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ];

    const [announcements, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<AnnouncementResponseDTO[]>(),
      this.model.countDocuments(query),
    ]);

    return { announcements, total };
  }

  async pinAnnouncement(id: string, workspaceId: string, isPinned: boolean): Promise<void> {
    await this.model.updateOne({ _id: id, workspaceId }, { $set: { isPinned } });
  }

  async markAsRead(id: string, workspaceId: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: id, workspaceId },
      { $addToSet: { readBy: userId } }
    );
  }

  async getUnreadCount(workspaceId: string, userId: string): Promise<number> {
    return await this.model.countDocuments({
      workspaceId,
      status: "published",
      readBy: { $ne: userId },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
  }

  async getByRoom(roomId: string, workspaceId: string): Promise<AnnouncementResponseDTO[]> {
    return await this.model
      .find({ roomId, workspaceId, status: "published" })
      .sort({ isPinned: -1, createdAt: -1 })
      .lean<AnnouncementResponseDTO[]>();
  }
}
