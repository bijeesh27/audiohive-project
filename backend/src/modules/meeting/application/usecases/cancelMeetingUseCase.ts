import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { ImeetingRepository } from "../../domain/ImeetingRepository.js";
import { CancelMeetingDTO } from "../dto/meetingDTO.js";
import { IMeetingDocument } from "../../infrastructure/meetingSchema.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";
import { UserRoles } from "../../../../common/constant/userRoles.js";

export class CancelMeetingUseCase
  implements IuseCase<CancelMeetingDTO, IMeetingDocument>
{
  constructor(private readonly meetingRepository: ImeetingRepository) {}

  async execute(input: CancelMeetingDTO): Promise<IMeetingDocument> {
    const { meetingId, workspaceId, userId, userRole } = input;

    const existing = await this.meetingRepository.findMeetingById(meetingId, workspaceId);
    if (!existing) {
      throw new AppError("Meeting not found", HttpStatus.NOT_FOUND);
    }

    const isHost =
      existing.hostId._id?.toString() === userId ||
      existing.hostId.toString() === userId;
    const isAdmin = userRole !== UserRoles.MEMBER;

    if (!isHost && !isAdmin) {
      throw new AppError(
        "You are not authorized to cancel this meeting",
        HttpStatus.FORBIDDEN
      );
    }

    const cancelled = await this.meetingRepository.cancelMeeting(
      meetingId,
      workspaceId
    );
    if (!cancelled) {
      throw new AppError(
        "Failed to cancel meeting",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return cancelled;
  }
}
