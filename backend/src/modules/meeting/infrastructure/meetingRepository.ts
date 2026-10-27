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
    userId?: string
  ): Promise<{ meetings: IMeetingDocument[]; total: number }> {
    const query: Record<string, unknown> = { workspaceId };

    if (status && status !== "all") {
      query.status = status;
    }

    if (userId) {
      query.$or = [
        { hostId: userId },
        { participants: userId },
        { participants: { $size: 0 } },
        { participants: { $exists: false } },
      ];
    }

    const skip = (page - 1) * limit;

    const [meetings, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ startTime: status === "completed" || status === "cancelled" ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .populate([
          { path: "hostId", select: "username email" },
          { path: "participants", select: "username email" },
        ])
        .exec(),
      this.model.countDocuments(query),
    ]);

    return { meetings, total };
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
