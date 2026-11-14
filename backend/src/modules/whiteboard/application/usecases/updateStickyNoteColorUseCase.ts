import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IWhiteboardRepository } from "../../domain/IwhiteboardRepository.js";
import { UpdateStickyNoteColorDTO, StickyNoteResponseDTO } from "../dto/whiteboardDTO.js";
import { ValidateRoomAccessDTO } from "../../../room/application/dto/roomDTO.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { MESSAGES } from "../../../../common/constant/messages.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";

export class UpdateStickyNoteColorUseCase
  implements IuseCase<UpdateStickyNoteColorDTO, StickyNoteResponseDTO>
{
  constructor(
    private readonly whiteboardRepository: IWhiteboardRepository,
    private readonly validateRoomAccessUseCase: IuseCase<ValidateRoomAccessDTO, boolean>
  ) {}

  async execute(input: UpdateStickyNoteColorDTO): Promise<StickyNoteResponseDTO> {
    const hasAccess = await this.validateRoomAccessUseCase.execute({
      roomId: input.roomId,
      userId: input.userId,
      role: input.role,
    });

    if (!hasAccess) {
      throw new AppError(
        MESSAGES.ERRORS.PRIVATE_ROOM_ACCESS_DENIED,
        HttpStatus.FORBIDDEN
      );
    }

    const existingNote = await this.whiteboardRepository.findById(input.noteId);
    if (!existingNote || existingNote.roomId !== input.roomId || existingNote.isDeleted) {
      throw new AppError("Sticky note not found", HttpStatus.NOT_FOUND);
    }

    const updated = await this.whiteboardRepository.update(input.noteId, {
      color: input.color,
      updatedBy: {
        userId: input.userId,
        username: input.username,
      },
    });

    if (!updated) {
      throw new AppError("Sticky note not found", HttpStatus.NOT_FOUND);
    }

    return updated;
  }
}
