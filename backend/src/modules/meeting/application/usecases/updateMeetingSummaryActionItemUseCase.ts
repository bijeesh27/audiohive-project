import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { UpdateMeetingActionItemDTO } from "../dto/meetingSummaryDTO.js";
import { IMeetingSummaryDocument } from "../../infrastructure/meetingSummarySchema.js";
import { IMeetingSummaryRepository } from "../../domain/IMeetingSummaryRepository.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";

export class UpdateMeetingSummaryActionItemUseCase
  implements IuseCase<UpdateMeetingActionItemDTO, IMeetingSummaryDocument | null>
{
  constructor(private readonly summaryRepository: IMeetingSummaryRepository) {}

  async execute(
    dto: UpdateMeetingActionItemDTO
  ): Promise<IMeetingSummaryDocument | null> {
    const updated = await this.summaryRepository.updateActionItemStatus(
      dto.meetingId,
      dto.itemIndex,
      dto.completed
    );

    if (!updated) {
      throw new AppError(
        "Meeting summary or action item not found",
        HttpStatus.NOT_FOUND
      );
    }

    return updated;
  }
}
