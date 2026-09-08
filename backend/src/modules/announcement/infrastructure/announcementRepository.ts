import { BaseRepository } from "../../../shared/common/baseRepository.js";
import { IAnnouncementRepository } from "../domain/IAnnouncementRepository.js";
import {
  AnnouncementModel,
  IAnnouncementDocument,
} from "./announcementSchema.js";

export class AnnouncementRepository
  extends BaseRepository<IAnnouncementDocument>
  implements IAnnouncementRepository
{
  constructor() {
    super(AnnouncementModel);
  }

  async createAnnouncement(
    data: Partial<IAnnouncementDocument>
  ): Promise<IAnnouncementDocument> {
    const created = await this.model.create(data);
    return created;
  }

  async updateAnnouncement(
    id: string,
    data: Partial<IAnnouncementDocument>
  ): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: data });
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id });
  }

  async findAnnouncement(id: string): Promise<IAnnouncementDocument | null> {
    return await this.model.findById(id).lean<IAnnouncementDocument>();
  }

  async getAllAnnouncements(
    workspaceId: string,
    page: number,
    limit: number,
    status?: string,
    search?: string
  ): Promise<{ announcements: IAnnouncementDocument[]; total: number }> {
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
        .lean<IAnnouncementDocument[]>(),
      this.model.countDocuments(query),
    ]);

    return { announcements, total };
  }

  async pinAnnouncement(id: string, isPinned: boolean): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { isPinned } });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: id },
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

  async getByRoom(roomId: string): Promise<IAnnouncementDocument[]> {
    return await this.model
      .find({ roomId, status: "published" })
      .sort({ isPinned: -1, createdAt: -1 })
      .lean<IAnnouncementDocument[]>();
  }
}
