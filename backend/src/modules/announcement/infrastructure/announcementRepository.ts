import { Model } from "mongoose";
import { BaseRepository } from "../../../shared/common/baseRepository.js";
import { IAnnouncementRepository } from "../domain/IAnnouncementRepository.js";
import { AnnouncementModel } from "./announcementSchema.js";
import {
  AnnouncementResponseDTO,
  PaginatedAnnouncementsResultDTO,
  AnnouncementItemDTO,
} from "../application/dto/announcementDTO.js";
import { UserModel } from "../../../shared/User.utils/userSchema.js";
import { buildWorkspaceMemberFilter } from "../../../shared/User.utils/workspaceMembership.js";
import { AppError } from "../../../common/Errors/AppError.js";

function escapeRegex(s: string): string {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

interface RawAnnouncementDoc {
  _id: { toString(): string };
  title: string;
  content: string;
  type: "info" | "warning" | "critical" | "event";
  status?: "draft" | "published" | "archived";
  isPinned?: boolean;
  targetAudience?: "all" | "room-specific";
  roomId?: { toString(): string } | null;
  readBy?: Array<{ toString(): string }>;
  createdBy?: { _id?: { toString(): string }; username?: string; email?: string } | { toString(): string };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export class AnnouncementRepository
  extends BaseRepository<AnnouncementResponseDTO>
  implements IAnnouncementRepository {
  constructor() {
    super(AnnouncementModel as unknown as Model<AnnouncementResponseDTO>);
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
    return await this.model
      .findOne({ _id: id, workspaceId })
      .populate("createdBy", "username email")
      .lean<AnnouncementResponseDTO>();
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

    // Search query: debounced server-side regex matching across title and content
    const searchQuery = (filters?.q || search || "").trim();
    if (searchQuery) {
      const escaped = escapeRegex(searchQuery);
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { content: { $regex: escaped, $options: "i" } },
      ];
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

    // Date range filter
    if (filters?.range && filters.range !== "all") {
      let days = 0;
      if (filters.range === "7d") days = 7;
      else if (filters.range === "30d") days = 30;
      else if (filters.range === "90d") days = 90;
      if (days > 0) {
        query.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }
    }

    // Tab / status filter: all | published | draft | archived | pinned
    const currentTab = (filters?.tab || status || "all").toLowerCase();
    const userId = filters?.userId;

    if (currentTab === "pinned") {
      query.isPinned = true;
    } else if (currentTab === "published") {
      query.status = "published";
    } else if (currentTab === "draft") {
      query.status = "draft";
    } else if (currentTab === "archived") {
      query.status = "archived";
    } else if (currentTab === "unread" && userId) {
      query.status = "published";
      query.readBy = { $ne: userId };
    }

    // Backend counts for tabs & workspace total members count
    const memberFilter = buildWorkspaceMemberFilter(workspaceId);
    const [countAll, countPublished, countDraft, countArchived, countPinned, totalMembersCount] =
      await Promise.all([
        this.model.countDocuments({ workspaceId }),
        this.model.countDocuments({ workspaceId, status: "published" }),
        this.model.countDocuments({ workspaceId, status: "draft" }),
        this.model.countDocuments({ workspaceId, status: "archived" }),
        this.model.countDocuments({ workspaceId, isPinned: true }),
        UserModel.countDocuments(memberFilter),
      ]);

    // Pinned announcements group for page 1 of "all" tab
    let rawPinnedDocs: RawAnnouncementDoc[] = [];
    const isAllTab = currentTab === "all" || currentTab === "";
    if (page === 1 && isAllTab) {
      const pinnedQuery: Record<string, unknown> = { workspaceId, isPinned: true };
      if (query.$or) pinnedQuery.$or = query.$or;
      if (query.type) pinnedQuery.type = query.type;
      rawPinnedDocs = (await this.model
        .find(pinnedQuery)
        .sort({ createdAt: -1 })
        .populate("createdBy", "username email")
        .lean()) as unknown as RawAnnouncementDoc[];
    }

    // Query for main list (exclude pinned docs on page 1 of All so they are not duplicated)
    const mainQuery = { ...query };
    if (page === 1 && isAllTab && rawPinnedDocs.length > 0) {
      mainQuery.isPinned = { $ne: true };
    }

    let rawDocs: RawAnnouncementDoc[];
    const sort = filters?.sort || "newest";

    if (sort === "most_read" || sort === "least_read") {
      const sortDir = sort === "most_read" ? -1 : 1;
      rawDocs = (await this.model.aggregate([
        { $match: mainQuery },
        { $addFields: { readCount: { $size: { $ifNull: ["$readBy", []] } } } },
        { $sort: { readCount: sortDir, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "authorUser",
          },
        },
        {
          $addFields: {
            createdBy: { $arrayElemAt: ["$authorUser", 0] },
          },
        },
        { $project: { authorUser: 0 } },
      ])) as unknown as RawAnnouncementDoc[];
    } else {
      const sortField: Record<string, 1 | -1> =
        sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
      rawDocs = (await this.model
        .find(mainQuery)
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "username email")
        .lean()) as unknown as RawAnnouncementDoc[];
    }

    const total = await this.model.countDocuments(query);

    const mapDoc = (doc: RawAnnouncementDoc): AnnouncementItemDTO => {
      const readByList = (doc.readBy || []).map((r) => r.toString());
      const isRead = userId ? readByList.includes(userId) : false;
      const authorName = (doc.createdBy && typeof doc.createdBy === "object" && "username" in doc.createdBy)
        ? (doc.createdBy as { username?: string }).username || "Admin"
        : "Admin";

      return {
        id: doc._id.toString(),
        _id: doc._id.toString(),
        title: doc.title,
        content: doc.content,
        type: doc.type,
        status: doc.status || "published",
        isPinned: Boolean(doc.isPinned),
        targetAudience: doc.targetAudience || "all",
        roomId: doc.roomId?.toString() || null,
        isRead,
        readBy: readByList,
        readCount: readByList.length,
        totalMembersCount,
        author: {
          id: (doc.createdBy && typeof doc.createdBy === "object" && "_id" in doc.createdBy && doc.createdBy._id)
            ? doc.createdBy._id.toString()
            : (doc.createdBy || "").toString(),
          name: authorName,
          email: (doc.createdBy && typeof doc.createdBy === "object" && "email" in doc.createdBy)
            ? (doc.createdBy as { email?: string }).email || ""
            : "",
          avatar: "",
        },
        audience: doc.targetAudience === "room-specific" ? "Room" : "Everyone",
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        expiresAt: doc.expiresAt,
      };
    };

    const items = rawDocs.map(mapDoc);
    const pinnedItems = rawPinnedDocs.map(mapDoc);
    const announcements = [...pinnedItems, ...items];
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      announcements,
      pinnedItems,
      total,
      page,
      limit,
      totalPages,
      totalMembersCount,
      counts: {
        all: countAll,
        published: countPublished,
        draft: countDraft,
        archived: countArchived,
        pinned: countPinned,
      },
      unreadCount: countAll - countPublished,
      pinnedCount: countPinned,
    };
  }

  async getAnnouncementReaders(
    id: string,
    workspaceId: string
  ): Promise<{
    totalMembers: number;
    readCount: number;
    unreadCount: number;
    readMembers: Array<{ _id: string; username: string; email: string; role?: string; avatar?: string }>;
    unreadMembers: Array<{ _id: string; username: string; email: string; role?: string; avatar?: string }>;
  }> {
    const announcement = await this.model.findOne({ _id: id, workspaceId }).lean();
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }

    const readBySet = new Set((announcement.readBy || []).map((uid) => String(uid)));
    const memberFilter = buildWorkspaceMemberFilter(workspaceId);
    const users = await UserModel.find(memberFilter, "_id username email role avatar createdAt").lean();

    type ReaderMemberItem = { _id: string; username: string; email: string; role?: string; avatar?: string };
    const readMembers: ReaderMemberItem[] = [];
    const unreadMembers: ReaderMemberItem[] = [];

    for (const user of users) {
      const uDto: ReaderMemberItem = {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role || "member",
        avatar: (user as { avatar?: string }).avatar || "",
      };
      if (readBySet.has(user._id.toString())) {
        readMembers.push(uDto);
      } else {
        unreadMembers.push(uDto);
      }
    }

    return {
      totalMembers: users.length,
      readCount: readMembers.length,
      unreadCount: unreadMembers.length,
      readMembers,
      unreadMembers,
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
