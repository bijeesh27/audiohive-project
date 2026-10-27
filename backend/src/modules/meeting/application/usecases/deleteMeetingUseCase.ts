import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { ImeetingRepository } from "../../domain/ImeetingRepository.js";
import { DeleteMeetingDTO } from "../dto/meetingDTO.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";
import { UserRoles } from "../../../../common/constant/userRoles.js";

export class DeleteMeetingUseCase implements IuseCase<DeleteMeetingDTO, void> {
  constructor(private readonly meetingRepository: ImeetingRepository) {}

  async execute(input: DeleteMeetingDTO): Promise<void> {
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
        "You are not authorized to delete this meeting",
        HttpStatus.FORBIDDEN
      );
    }

    await this.meetingRepository.deleteMeeting(meetingId, workspaceId);
  }
}
