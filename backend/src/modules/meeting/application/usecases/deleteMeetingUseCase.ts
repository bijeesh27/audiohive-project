import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { ImeetingRepository } from "../../domain/ImeetingRepository.js";
import { DeleteMeetingDTO } from "../dto/meetingDTO.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";
import { UserRoles } from "../../../../common/constant/userRoles.js";
import { MESSAGES } from "../../../../common/constant/messages.js";

export class DeleteMeetingUseCase implements IuseCase<DeleteMeetingDTO, void> {
  constructor(private readonly meetingRepository: ImeetingRepository) {}

  async execute(input: DeleteMeetingDTO): Promise<void> {
    const { meetingId, workspaceId, userId, userRole } = input;

    const existing = await this.meetingRepository.findMeetingById(meetingId, workspaceId);
    if (!existing) {
      throw new AppError(MESSAGES.ERRORS.MEETING_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const isHost =
      existing.hostId._id?.toString() === userId ||
      existing.hostId.toString() === userId;
    const isAdmin = userRole !== UserRoles.MEMBER;

    if (!isHost && !isAdmin) {
      throw new AppError(
        MESSAGES.ERRORS.UNAUTHORIZED_DELETE_MEETING,
        HttpStatus.FORBIDDEN
      );
    }

    await this.meetingRepository.deleteMeeting(meetingId, workspaceId);
  }
}
