import mongoose from "mongoose";
import logger from "../../../shared/utils/logger.js";
import { ILiveTranscriptRepository } from "../domain/ILiveTranscriptRepository.js";
import {
  LiveTranscriptTurnDTO,
  MeetingLiveTranscriptDTO,
} from "../application/dto/liveTranscriptDTO.js";
import {
  MeetingLiveTranscriptModel,
  IMeetingLiveTranscriptDocument,
} from "./meetingLiveTranscriptSchema.js";

export class LiveTranscriptRepository implements ILiveTranscriptRepository {
  async addTurn(
    meetingId: string,
    workspaceId: string | undefined,
    turn: LiveTranscriptTurnDTO
  ): Promise<void> {
    try {
      const workspaceObjectId =
        workspaceId && mongoose.Types.ObjectId.isValid(workspaceId)
          ? new mongoose.Types.ObjectId(workspaceId)
          : undefined;

      await MeetingLiveTranscriptModel.findOneAndUpdate(
        { meetingId },
        {
          $setOnInsert: {
            meetingId,
            ...(workspaceObjectId ? { workspaceId: workspaceObjectId } : {}),
          },
          $push: { turns: turn },
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error(
        `[LiveTranscriptRepository] Failed to persist transcript turn for meeting ${meetingId}:`,
        error
      );
    }
  }

  async getTranscriptByMeetingId(
    meetingId: string
  ): Promise<MeetingLiveTranscriptDTO | null> {
    try {
      const doc = await MeetingLiveTranscriptModel.findOne({ meetingId }).lean<
        IMeetingLiveTranscriptDocument | null
      >();

      if (!doc) return null;

      return {
        id: (doc as unknown as { _id: mongoose.Types.ObjectId })._id.toString(),
        meetingId: doc.meetingId,
        workspaceId: doc.workspaceId?.toString(),
        turns: doc.turns.map((t) => ({
          id: t.id,
          speakerId: t.speakerId,
          speakerName: t.speakerName,
          text: t.text,
          timestamp: t.timestamp,
        })),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    } catch (error) {
      logger.error(
        `[LiveTranscriptRepository] Failed to fetch transcript for meeting ${meetingId}:`,
        error
      );
      return null;
    }
  }

  async clearTranscript(meetingId: string): Promise<void> {
    try {
      await MeetingLiveTranscriptModel.deleteOne({ meetingId });
    } catch (error) {
      logger.error(
        `[LiveTranscriptRepository] Failed to delete transcript for meeting ${meetingId}:`,
        error
      );
    }
  }
}

export const liveTranscriptRepository = new LiveTranscriptRepository();
