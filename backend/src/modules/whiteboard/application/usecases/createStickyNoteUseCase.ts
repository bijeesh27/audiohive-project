import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IWhiteboardRepository } from "../../domain/IwhiteboardRepository.js";
import { CreateStickyNoteDTO, StickyNoteResponseDTO } from "../dto/whiteboardDTO.js";
import { ValidateRoomAccessDTO } from "../../../room/application/dto/roomDTO.js";
import { IroomRepository } from "../../../room/domain/IroomRepository.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { MESSAGES } from "../../../../common/constant/messages.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";

export class CreateStickyNoteUseCase
  implements IuseCase<CreateStickyNoteDTO, StickyNoteResponseDTO>
{
  constructor(
    private readonly whiteboardRepository: IWhiteboardRepository,
    private readonly validateRoomAccessUseCase: IuseCase<ValidateRoomAccessDTO, boolean>,
    private readonly roomRepository: IroomRepository
  ) {}

  async execute(input: CreateStickyNoteDTO): Promise<StickyNoteResponseDTO> {
    const room = await this.roomRepository.findRoom(input.roomId);
    if (!room) {
      throw new AppError(MESSAGES.ERRORS.ROOM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const effectiveWorkspaceId =
      input.workspaceId || room.workspaceId?.toString() || "";

    const hasAccess = await this.validateRoomAccessUseCase.execute({
      roomId: input.roomId,
      workspaceId: effectiveWorkspaceId,
      userId: input.userId,
      role: input.role,
    });

    if (!hasAccess) {
      throw new AppError(
        MESSAGES.ERRORS.PRIVATE_ROOM_ACCESS_DENIED,
        HttpStatus.FORBIDDEN
      );
    }

    const defaultColors = [
      "#fef08a", // yellow
      "#fed7aa", // orange
      "#bbf7d0", // green
      "#bae6fd", // sky blue
      "#e9d5ff", // purple
      "#fbcfe8", // pink
    ];

    const randomColor =
      input.color ||
      defaultColors[Math.floor(Math.random() * defaultColors.length)];

    const posX =
      input.positionX !== undefined
        ? input.positionX
        : Math.round(80 + Math.random() * 200);
    const posY =
      input.positionY !== undefined
        ? input.positionY
        : Math.round(80 + Math.random() * 150);

    return this.whiteboardRepository.create({
      roomId: input.roomId,
      workspaceId: effectiveWorkspaceId,
      content: input.content || "",
      positionX: posX,
      positionY: posY,
      color: randomColor,
      createdBy: {
        userId: input.userId,
        username: input.username,
        email: input.userEmail,
      },
      version: 1,
      isDeleted: false,
    });
  }
}
