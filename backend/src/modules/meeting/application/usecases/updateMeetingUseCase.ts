import mongoose from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { ImeetingRepository } from "../../domain/ImeetingRepository.js";
import { UpdateMeetingDTO } from "../dto/meetingDTO.js";
import { IMeetingDocument } from "../../infrastructure/meetingSchema.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";
import { UserRoles } from "../../../../common/constant/userRoles.js";

export class UpdateMeetingUseCase
  implements IuseCase<UpdateMeetingDTO, IMeetingDocument>
{
  constructor(private readonly meetingRepository: ImeetingRepository) {}

  async execute(input: UpdateMeetingDTO): Promise<IMeetingDocument> {
    const { meetingId, workspaceId, userId, userRole, data } = input;

    const existing = await this.meetingRepository.findMeetingById(meetingId, workspaceId);
    if (!existing) {
      throw new AppError("Meeting not found", HttpStatus.NOT_FOUND);
    }

    // Only host or workspace admin / super admin can update
    const isHost = existing.hostId._id?.toString() === userId || existing.hostId.toString() === userId;
    const isAdmin = userRole !== UserRoles.MEMBER;

    if (!isHost && !isAdmin) {
      throw new AppError("You are not authorized to update this meeting", HttpStatus.FORBIDDEN);
    }

    const updatePayload: Partial<IMeetingDocument> = {};
    if (data.title) updatePayload.title = data.title.trim();
    if (typeof data.description === "string") updatePayload.description = data.description.trim();
    if (data.status) updatePayload.status = data.status;

    if (data.startTime) {
      const start = new Date(data.startTime);
      if (isNaN(start.getTime())) {
        throw new AppError("Invalid start time", HttpStatus.BAD_REQUEST);
      }
      updatePayload.startTime = start;
    }

    if (data.endTime) {
      const end = new Date(data.endTime);
      if (isNaN(end.getTime())) {
        throw new AppError("Invalid end time", HttpStatus.BAD_REQUEST);
      }
      updatePayload.endTime = end;
    }

    if (data.participants) {
      updatePayload.participants = data.participants
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    }

    const updated = await this.meetingRepository.updateMeeting(meetingId, workspaceId, updatePayload);
    if (!updated) {
      throw new AppError("Failed to update meeting", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return updated;
  }
}
