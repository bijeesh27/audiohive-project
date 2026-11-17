import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { IRoomDocument } from "../../infrastructure/roomSchema";
import { UpdateRoomRequestDTO } from "../dto/roomDTO";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { HttpStatus } from "../../../../common/constant/httpStatus";

export class UpdateRoomUseCase implements IuseCase<UpdateRoomRequestDTO, void> {
  constructor(
    private readonly roomRepository: IroomRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) { }

  async execute({ roomId, data }: UpdateRoomRequestDTO): Promise<void> {
    const room = await this.roomRepository.findRoom(roomId);
    if (!room) {
      throw new AppError("Room not found", HttpStatus.NOT_FOUND);
    }

    const isDefaultRoom = Boolean(room.isDefault || room.name === "Lounge" || room.name === "Office Common Room");
    if (isDefaultRoom) {
      if (data.type === "private" || data.isPrivate === true) {
        throw new AppError("System default rooms cannot be made private", HttpStatus.FORBIDDEN);
      }
      if (data.status === "blocked") {
        throw new AppError("System default rooms (Lounge, Office Common Room) cannot be disabled", HttpStatus.FORBIDDEN);
      }
    }

    if (data.type === "private") {
      data.isPrivate = true;
    } else if (data.type === "public" || data.type === "lounge" || data.type === "standard") {
      data.isPrivate = false;
    }
    await this.roomRepository.updateRoom(roomId, data.workspaceId, data as Partial<IRoomDocument>);

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "ROOM_UPDATED",
      actorId: data.actorId || null,
      organizationId: data.organizationId,
      workspaceId: data.workspaceId,
      targetType: "Room",
      targetId: roomId,
      metadata: { changes: Object.keys(data) }
    });
  }
}
