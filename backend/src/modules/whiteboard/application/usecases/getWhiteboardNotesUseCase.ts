import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IWhiteboardRepository } from "../../domain/IwhiteboardRepository.js";
import { GetWhiteboardNotesDTO, StickyNoteResponseDTO } from "../dto/whiteboardDTO.js";
import { ValidateRoomAccessDTO } from "../../../room/application/dto/roomDTO.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { MESSAGES } from "../../../../common/constant/messages.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";

export class GetWhiteboardNotesUseCase
  implements IuseCase<GetWhiteboardNotesDTO, StickyNoteResponseDTO[]>
{
  constructor(
    private readonly whiteboardRepository: IWhiteboardRepository,
    private readonly validateRoomAccessUseCase: IuseCase<ValidateRoomAccessDTO, boolean>
  ) {}

  async execute(input: GetWhiteboardNotesDTO): Promise<StickyNoteResponseDTO[]> {
    const hasAccess = await this.validateRoomAccessUseCase.execute({
      roomId: input.roomId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      role: input.role,
    });

    if (!hasAccess) {
      throw new AppError(
        MESSAGES.ERRORS.PRIVATE_ROOM_ACCESS_DENIED,
        HttpStatus.FORBIDDEN
      );
    }

    return this.whiteboardRepository.findByRoomId(input.roomId);
  }
}
