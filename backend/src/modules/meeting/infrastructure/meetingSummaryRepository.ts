import { IMeetingSummaryRepository } from "../domain/IMeetingSummaryRepository.js";
import { UpsertMeetingSummaryData } from "../application/dto/meetingSummaryDTO.js";
import {
  IMeetingSummaryDocument,
  MeetingSummaryModel,
} from "./meetingSummarySchema.js";

export class MeetingSummaryRepository implements IMeetingSummaryRepository {
  async upsertSummary(
    meetingId: string,
    data: UpsertMeetingSummaryData
  ): Promise<IMeetingSummaryDocument> {
    const doc = await MeetingSummaryModel.findOneAndUpdate(
      { meetingId },
      {
        $set: {
          ...data,
          meetingId,
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    ).exec();

    return doc!;
  }

  async findByMeetingId(meetingId: string): Promise<IMeetingSummaryDocument | null> {
    return MeetingSummaryModel.findOne({ meetingId }).exec();
  }

  async updateActionItemStatus(
    meetingId: string,
    itemIndex: number,
    completed: boolean
  ): Promise<IMeetingSummaryDocument | null> {
    const summary = await MeetingSummaryModel.findOne({ meetingId }).exec();
    if (!summary || !summary.actionItems || !summary.actionItems[itemIndex]) {
      return null;
    }

    summary.actionItems[itemIndex].completed = completed;
    await summary.save();
    return summary;
  }
}
