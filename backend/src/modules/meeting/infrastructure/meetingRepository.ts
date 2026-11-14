import { BaseRepository } from "../../../shared/common/baseRepository.js";
import { ImeetingRepository } from "../domain/ImeetingRepository.js";
import { IMeetingDocument, MeetingModel } from "./meetingSchema.js";

export class MeetingRepository
  extends BaseRepository<IMeetingDocument>
  implements ImeetingRepository
{
  constructor() {
    super(MeetingModel);
  }

  async createMeeting(data: Partial<IMeetingDocument>): Promise<IMeetingDocument> {
    const created = await this.model.create(data);
    return await created.populate([
      { path: "hostId", select: "username email" },
      { path: "participants", select: "username email" },
    ]);
  }

 

  async findMeetingById(
    meetingId: string,
    workspaceId?: string
  ): Promise<IMeetingDocument | null> {
    const filter: Record<string, unknown> = { _id: meetingId };
    if (workspaceId) filter.workspaceId = workspaceId;

    return await this.model
      .findOne(filter)
      .populate([
        { path: "hostId", select: "username email" },
        { path: "participants", select: "username email" },
      ])
      .exec();
  }

  async findMeetingByCode(
    meetingCode: string,
    workspaceId?: string
  ): Promise<IMeetingDocument | null> {
    const filter: Record<string, unknown> = { meetingCode };
    if (workspaceId) filter.workspaceId = workspaceId;

    return await this.model
      .findOne(filter)
      .populate([
        { path: "hostId", select: "username email" },
        { path: "participants", select: "username email" },
      ])
      .exec();
  }

  async getWorkspaceMeetings(
    workspaceId: string,
    page = 1,
    limit = 20,
    status?: string,
    userId?: string,
    tab?: string,
    q?: string
  ): Promise<{
    meetings: IMeetingDocument[];
    total: number;
    totalPages?: number;
    page?: number;
    counts?: { upcoming: number; past: number; cancelled: number };
  }> {
    const baseQuery: Record<string, unknown> = { workspaceId };

    if (userId) {
      baseQuery.$or = [
        { hostId: userId },
        { participants: userId },
        { participants: { $size: 0 } },
        { participants: { $exists: false } },
      ];
    }

    if (q && q.trim()) {
      const regex = { $regex: q.trim(), $options: "i" };
      baseQuery.$and = [
        {
          $or: [{ title: regex }, { meetingCode: regex }, { description: regex }],
        },
      ];
    }

    const now = new Date();

    // Query builder per tab
    const upcomingCondition = {
      ...baseQuery,
      status: { $nin: ["cancelled", "completed"] },
      endTime: { $gte: now },
    };

    const pastCondition = {
      ...baseQuery,
      $or: [
        { status: "completed" },
        { endTime: { $lt: now }, status: { $ne: "cancelled" } },
      ],
    };

    const cancelledCondition = {
      ...baseQuery,
      status: "cancelled",
    };

    // Calculate counts for all 3 tabs under current search filter
    const [upcomingCount, pastCount, cancelledCount] = await Promise.all([
      this.model.countDocuments(upcomingCondition),
      this.model.countDocuments(pastCondition),
      this.model.countDocuments(cancelledCondition),
    ]);

    const counts = {
      upcoming: upcomingCount,
      past: pastCount,
      cancelled: cancelledCount,
    };

    let activeQuery: Record<string, unknown>;
    let sortOrder: Record<string, 1 | -1>;

    if (tab === "past") {
      activeQuery = pastCondition;
      sortOrder = { startTime: -1 }; // newest first
    } else if (tab === "cancelled") {
      activeQuery = cancelledCondition;
      sortOrder = { startTime: -1 }; // newest first
    } else if (tab === "upcoming") {
      activeQuery = upcomingCondition;
      sortOrder = { startTime: 1 }; // earliest first
    } else if (status && status !== "all") {
      activeQuery = { ...baseQuery, status };
      sortOrder = { startTime: status === "completed" || status === "cancelled" ? -1 : 1 };
    } else {
      activeQuery = upcomingCondition;
      sortOrder = { startTime: 1 };
    }

    const total =
      tab === "past"
        ? pastCount
        : tab === "cancelled"
        ? cancelledCount
        : tab === "upcoming"
        ? upcomingCount
        : await this.model.countDocuments(activeQuery);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const skip = (safePage - 1) * limit;

    const meetings = await this.model
      .find(activeQuery)
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .populate([
        { path: "hostId", select: "username email" },
        { path: "participants", select: "username email" },
      ])
      .exec();

    return { meetings, total, totalPages, page: safePage, counts };
  }

  async updateMeeting(
    meetingId: string,
    workspaceId: string,
    data: Partial<IMeetingDocument>
  ): Promise<IMeetingDocument | null> {
    return await this.model
      .findOneAndUpdate(
        { _id: meetingId, workspaceId },
        { $set: data },
        { new: true }
      )
      .populate([
        { path: "hostId", select: "username email" },
        { path: "participants", select: "username email" },
      ])
      .exec();
  }

  async cancelMeeting(
    meetingId: string,
    workspaceId: string
  ): Promise<IMeetingDocument | null> {
    return await this.model
      .findOneAndUpdate(
        { _id: meetingId, workspaceId },
        { $set: { status: "cancelled" } },
        { new: true }
      )
      .populate([
        { path: "hostId", select: "username email" },
        { path: "participants", select: "username email" },
      ])
      .exec();
  }

  async deleteMeeting(meetingId: string, workspaceId: string): Promise<void> {
    await this.model.deleteOne({ _id: meetingId, workspaceId });
  }
}
