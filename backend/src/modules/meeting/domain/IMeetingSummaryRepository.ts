import { UpsertMeetingSummaryData } from "../application/dto/meetingSummaryDTO.js";
import { IMeetingSummaryDocument } from "../infrastructure/meetingSummarySchema.js";

export interface IMeetingSummaryRepository {
  upsertSummary(
    meetingId: string,
    data: UpsertMeetingSummaryData
  ): Promise<IMeetingSummaryDocument>;

  findByMeetingId(meetingId: string): Promise<IMeetingSummaryDocument | null>;

  updateActionItemStatus(
    meetingId: string,
    itemIndex: number,
    completed: boolean
  ): Promise<IMeetingSummaryDocument | null>;
}
