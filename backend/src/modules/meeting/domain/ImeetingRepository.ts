import { IMeetingDocument } from "../infrastructure/meetingSchema.js";

export interface ImeetingRepository {
  createMeeting(data: Partial<IMeetingDocument>): Promise<IMeetingDocument>;
  findMeetingById(
    meetingId: string,
    workspaceId?: string
  ): Promise<IMeetingDocument | null>;
  findMeetingByCode(
    meetingCode: string,
    workspaceId?: string
  ): Promise<IMeetingDocument | null>;
  getWorkspaceMeetings(
    workspaceId: string,
    page?: number,
    limit?: number,
    status?: string,
    userId?: string
  ): Promise<{ meetings: IMeetingDocument[]; total: number }>;
  updateMeeting(
    meetingId: string,
    workspaceId: string,
    data: Partial<IMeetingDocument>
  ): Promise<IMeetingDocument | null>;
  cancelMeeting(
    meetingId: string,
    workspaceId: string
  ): Promise<IMeetingDocument | null>;
  deleteMeeting(meetingId: string, workspaceId: string): Promise<void>;
}
