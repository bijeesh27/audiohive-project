import mongoose from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { GenerateMeetingSummaryDTO } from "../dto/meetingSummaryDTO.js";
import { IMeetingSummaryDocument } from "../../infrastructure/meetingSummarySchema.js";
import { IMeetingSummaryRepository } from "../../domain/IMeetingSummaryRepository.js";
import { ImeetingRepository } from "../../domain/ImeetingRepository.js";
import { ILiveTranscriptRepository } from "../../domain/ILiveTranscriptRepository.js";
import { groqSummaryService } from "../../../../services/groqSummary.service.js";
import { RoomModel } from "../../../room/infrastructure/roomSchema.js";
import logger from "../../../../shared/utils/logger.js";

export class GenerateMeetingSummaryUseCase
  implements IuseCase<GenerateMeetingSummaryDTO, IMeetingSummaryDocument> {
  constructor(
    private readonly summaryRepository: IMeetingSummaryRepository,
    private readonly meetingRepository: ImeetingRepository,
    private readonly liveTranscriptRepository: ILiveTranscriptRepository
  ) { }

  async execute(dto: GenerateMeetingSummaryDTO): Promise<IMeetingSummaryDocument> {
    const { meetingId, workspaceId, userId, customNotes } = dto;

    let title = "Conference Call";
    let participants: string[] = [];
    let workspaceObjectId: mongoose.Types.ObjectId | undefined = workspaceId
      ? new mongoose.Types.ObjectId(workspaceId)
      : undefined;

    // 1. Try finding meeting
    try {
      let meeting = null;
      if (mongoose.Types.ObjectId.isValid(meetingId)) {
        meeting = await this.meetingRepository.findMeetingById(meetingId, workspaceId);
      }
      if (!meeting) {
        meeting = await this.meetingRepository.findMeetingByCode(meetingId, workspaceId);
      }

      if (meeting) {
        title = meeting.title || title;
        if (meeting.workspaceId) {
          workspaceObjectId = meeting.workspaceId as mongoose.Types.ObjectId;
        }

        const rawParticipants = Array.isArray(meeting.participants)
          ? meeting.participants
          : [];
        participants = rawParticipants
          .map((p: { username?: string; name?: string } | unknown) => {
            if (typeof p === "object" && p !== null) {
              const obj = p as { username?: string; name?: string };
              return obj.username || obj.name || "";
            }
            return "";
          })
          .filter(Boolean);

        const hostName = (meeting.hostId as { username?: string } | undefined)?.username;
        if (hostName && !participants.includes(hostName)) {
          participants.unshift(hostName);
        }
      } else if (mongoose.Types.ObjectId.isValid(meetingId)) {
        // Fallback: check if it's a Room
        const room = await RoomModel.findById(meetingId).exec();
        if (room) {
          title = `${room.name} Session`;
          if (room.workspaceId) {
            workspaceObjectId = room.workspaceId as mongoose.Types.ObjectId;
          }
        }
      }
    } catch (err) {
      logger.warn(`[GenerateMeetingSummary] Error resolving meeting/room info for ${meetingId}:`, err);
    }

    // 2. Fetch transcript turns
    const transcriptDoc = await this.liveTranscriptRepository.getTranscriptByMeetingId(meetingId);
    const turns = transcriptDoc?.turns || [];

    // 3. Generate summary via Groq LLM
    const generated = await groqSummaryService.generateSummary({
      meetingTitle: title,
      turns,
      customNotes,
      participants,
    });

    // 4. Upsert into database
    const saved = await this.summaryRepository.upsertSummary(meetingId, {
      workspaceId: workspaceObjectId,
      title: generated.title || title,
      overview: generated.overview,
      keyPoints: generated.keyPoints,
      actionItems: generated.actionItems,
      decisions: generated.decisions,
      sentiment: generated.sentiment,
      keywords: generated.keywords,
      speakers: generated.speakers,
      durationMinutes: generated.durationMinutes,
      totalTurns: generated.totalTurns,
      generatedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      modelUsed: generated.modelUsed,
      transcriptSnippet: generated.transcriptSnippet,
      customNotes: customNotes || "",
    });

    return saved;
  }
}
