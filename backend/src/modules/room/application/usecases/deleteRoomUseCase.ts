import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { IroomRepository } from "../../domain/IroomRepository";
import { DeleteRoomDTO } from "../dto/roomDTO";

export class DeleteRoomUseCase implements IuseCase<DeleteRoomDTO, void> {
  constructor(
    private readonly roomRepository: IroomRepository,
        private readonly activityLogRepository: IactivityLogRepository
    
  ) {}

  async execute({ roomId, workspaceId, organizationId, actorId }: DeleteRoomDTO): Promise<void> {
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
