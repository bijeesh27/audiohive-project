import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { ImeetingRepository } from "../../domain/ImeetingRepository.js";
import { GetMeetingByIdDTO } from "../dto/meetingDTO.js";
import { IMeetingDocument } from "../../infrastructure/meetingSchema.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";
import { MESSAGES } from "../../../../common/constant/messages.js";

export class GetMeetingByIdUseCase
  implements IuseCase<GetMeetingByIdDTO, IMeetingDocument>
{
  constructor(private readonly meetingRepository: ImeetingRepository) {}

  async execute(input: GetMeetingByIdDTO): Promise<IMeetingDocument> {
    const { meetingId, workspaceId } = input;

    const meeting = meetingId.startsWith("meet-")
      ? await this.meetingRepository.findMeetingByCode(meetingId, workspaceId)
      : await this.meetingRepository.findMeetingById(meetingId, workspaceId);

    if (!meeting) {
      throw new AppError(MESSAGES.ERRORS.MEETING_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return meeting;
  }
}
