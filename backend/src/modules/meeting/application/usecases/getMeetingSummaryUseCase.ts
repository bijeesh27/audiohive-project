import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { GetMeetingSummaryDTO } from "../dto/meetingSummaryDTO.js";
import { IMeetingSummaryDocument } from "../../infrastructure/meetingSummarySchema.js";
import { IMeetingSummaryRepository } from "../../domain/IMeetingSummaryRepository.js";

export class GetMeetingSummaryUseCase
  implements IuseCase<GetMeetingSummaryDTO, IMeetingSummaryDocument | null>
{
  constructor(private readonly summaryRepository: IMeetingSummaryRepository) {}

  async execute(dto: GetMeetingSummaryDTO): Promise<IMeetingSummaryDocument | null> {
    return this.summaryRepository.findByMeetingId(dto.meetingId);
  }
}
