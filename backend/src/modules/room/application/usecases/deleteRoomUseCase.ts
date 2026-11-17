import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { IroomRepository } from "../../domain/IroomRepository";
import { DeleteRoomDTO } from "../dto/roomDTO";
import { AppError } from "../../../../common/Errors/AppError";
import { HttpStatus } from "../../../../common/constant/httpStatus";

export class DeleteRoomUseCase implements IuseCase<DeleteRoomDTO, void> {
  constructor(
    private readonly roomRepository: IroomRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute({ roomId, workspaceId, organizationId, actorId }: DeleteRoomDTO): Promise<void> {
    const room = await this.roomRepository.findRoom(roomId);
    if (!room) {
      throw new AppError("Room not found", HttpStatus.NOT_FOUND);
    }

    if (room.isDefault || room.name === "Lounge" || room.name === "Office Common Room") {
      throw new AppError(
        "System default rooms (Lounge, Office Common Room) cannot be deleted",
        HttpStatus.FORBIDDEN
      );
    }

    await this.roomRepository.deleteRoom(roomId, workspaceId);

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "ROOM_DELETED",
      actorId: actorId || null,
      organizationId,
      workspaceId,
      targetType: "ROOM",
      targetId: roomId,
    });
  }
}
