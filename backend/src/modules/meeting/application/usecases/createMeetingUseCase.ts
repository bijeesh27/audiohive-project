import crypto from "crypto";
import mongoose from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { ImeetingRepository } from "../../domain/ImeetingRepository.js";
import { CreateMeetingDTO } from "../dto/meetingDTO.js";
import { IMeetingDocument } from "../../infrastructure/meetingSchema.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";
import { MESSAGES } from "../../../../common/constant/messages.js";

export class CreateMeetingUseCase
  implements IuseCase<CreateMeetingDTO, IMeetingDocument>
{
  constructor(private readonly meetingRepository: ImeetingRepository) {}

  async execute(input: CreateMeetingDTO): Promise<IMeetingDocument> {
    const { title, description, startTime, endTime, hostId, workspaceId, participants } = input;

    if (!title || !title.trim()) {
      throw new AppError(MESSAGES.ERRORS.MEETING_TITLE_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError(MESSAGES.ERRORS.INVALID_MEETING_TIME, HttpStatus.BAD_REQUEST);
    }

    if (start >= end) {
      throw new AppError(MESSAGES.ERRORS.MEETING_START_BEFORE_END, HttpStatus.BAD_REQUEST);
    }

    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const meetingCode = `meet-${randomSuffix}`;

    const participantObjectIds = (participants || [])
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    return await this.meetingRepository.createMeeting({
      title: title.trim(),
      description: (description || "").trim(),
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      hostId: new mongoose.Types.ObjectId(hostId),
      startTime: start,
      endTime: end,
      status: "scheduled",
      meetingCode,
      participants: participantObjectIds,
    });
  }
}
