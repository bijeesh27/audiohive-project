import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IWhiteboardRepository } from "../../domain/IwhiteboardRepository.js";
import { UpdateStickyNoteDTO, StickyNoteResponseDTO } from "../dto/whiteboardDTO.js";
import { ValidateRoomAccessDTO } from "../../../room/application/dto/roomDTO.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { MESSAGES } from "../../../../common/constant/messages.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";

export class UpdateStickyNoteUseCase
  implements IuseCase<UpdateStickyNoteDTO, StickyNoteResponseDTO>
{
  constructor(
    private readonly whiteboardRepository: IWhiteboardRepository,
    private readonly validateRoomAccessUseCase: IuseCase<ValidateRoomAccessDTO, boolean>
  ) {}

  async execute(input: UpdateStickyNoteDTO): Promise<StickyNoteResponseDTO> {
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

    const updated = await this.whiteboardRepository.update(
      input.noteId,
      {
        content: input.content,
        positionX: input.positionX,
        positionY: input.positionY,
        color: input.color,
        updatedBy: {
          userId: input.userId,
          username: input.username,
        },
      },
      input.expectedVersion
    );

    if (!updated) {
      // If version mismatch occurred
      const current = await this.whiteboardRepository.findById(input.noteId);
      if (current) {
        throw new AppError(
          "Conflict: The note was updated by another participant. Please refresh.",
          HttpStatus.CONFLICT
        );
      }
      throw new AppError("Sticky note not found", HttpStatus.NOT_FOUND);
    }

    return updated;
  }
}
