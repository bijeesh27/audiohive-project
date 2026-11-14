import { BaseRepository } from "../../../shared/common/baseRepository.js";
import { IAnnouncementRepository } from "../domain/IAnnouncementRepository.js";
import { AnnouncementModel } from "./announcementSchema.js";
import {
  AnnouncementResponseDTO,
  PaginatedAnnouncementsResultDTO,
  MemberAnnouncementDTO,
} from "../application/dto/announcementDTO.js";

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
    search?: string,
    filters?: {
      q?: string;
      tab?: string;
      type?: string;
      range?: string;
      sort?: string;
      userId?: string;
    }
  ): Promise<PaginatedAnnouncementsResultDTO> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { workspaceId };

    if (status && status !== "all") {
      query.status = status;
    } else if (!status) {
      query.status = "published";
    }

    // Active (not expired)
    const andConditions: Record<string, unknown>[] = [
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      },
    ];

    // Search query
    const searchQuery = filters?.q || search;
    if (searchQuery) {
      andConditions.push({
        $or: [
          { title: { $regex: searchQuery, $options: "i" } },
          { content: { $regex: searchQuery, $options: "i" } },
        ],
      });
    }

    // Date range
    if (filters?.range && filters.range !== "all") {
      let days = 0;
      if (filters.range === "7d") days = 7;
      else if (filters.range === "30d") days = 30;
      else if (filters.range === "90d") days = 90;
      if (days > 0) {
        andConditions.push({
          createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
        });
      }
    }

    // Type filter
    if (filters?.type && filters.type !== "all") {
      const t = filters.type.toLowerCase();
      if (t === "important" || t === "warning") {
        query.type = { $in: ["warning", "important"] };
      } else if (t === "urgent" || t === "critical") {
        query.type = { $in: ["critical", "urgent"] };
      } else {
        query.type = t;
      }
    }

    // Tab filter: all | unread | pinned
    const userId = filters?.userId;
    if (filters?.tab === "unread" && userId) {
      query.readBy = { $ne: userId };
    } else if (filters?.tab === "pinned") {
      query.isPinned = true;
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Sort order
    const sortField: Record<string, 1 | -1> =
      filters?.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [rawDocs, total, unreadCount, pinnedCount] = await Promise.all([
      this.model
        .find(query)
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .populate<{ createdBy: { _id: string; username: string; email: string } }>(
          "createdBy",
          "username email"
        )
        .lean(),
      this.model.countDocuments(query),
      userId ? this.getUnreadCount(workspaceId, userId) : Promise.resolve(0),
      this.getPinnedCount(workspaceId),
    ]);

    const announcements: MemberAnnouncementDTO[] = (rawDocs as any[]).map((doc) => {
      const isRead = userId
        ? (doc.readBy || []).some((r: any) => r.toString() === userId)
        : false;
      const authorName = doc.createdBy?.username || "Admin";

      return {
        id: doc._id.toString(),
        _id: doc._id.toString(),
        title: doc.title,
        content: doc.content,
        type: doc.type,
        isPinned: !!doc.isPinned,
        isRead,
        author: {
          id: doc.createdBy?._id?.toString() || (doc.createdBy || "").toString(),
          name: authorName,
          avatar: "",
        },
        audience: doc.targetAudience === "room-specific" ? "Room" : "Everyone",
        createdAt: doc.createdAt,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      announcements,
      total,
      page,
      totalPages,
      unreadCount,
      pinnedCount,
    };
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

  async markAsUnread(id: string, workspaceId: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: id, workspaceId },
      { $pull: { readBy: userId } }
    );
  }

  async markAllAsRead(workspaceId: string, userId: string): Promise<number> {
    const res = await this.model.updateMany(
      {
        workspaceId,
        status: "published",
        readBy: { $ne: userId },
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      },
      { $addToSet: { readBy: userId } }
    );
    return res.modifiedCount;
  }

  async getUnreadCount(workspaceId: string, userId: string): Promise<number> {
    return await this.model.countDocuments({
      workspaceId,
      status: "published",
      readBy: { $ne: userId },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
  }

  async getPinnedCount(workspaceId: string): Promise<number> {
    return await this.model.countDocuments({
      workspaceId,
      status: "published",
      isPinned: true,
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
