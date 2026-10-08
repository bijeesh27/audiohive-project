import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { IroomRepository } from "../../domain/IroomRepository";
import { DeleteRoomDTO } from "../dto/roomDTO";

export class DeleteRoomUseCase implements IuseCase<DeleteRoomDTO, void> {
  constructor(
    private readonly roomRepository: IroomRepository,
        private readonly activityLogRepository: IactivityLogRepository
    
  ) {}

  async execute({ roomId }: DeleteRoomDTO): Promise<void> {
    await this.roomRepository.deleteRoom(roomId);

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "ROOM_DELETED",
      actorId: null,
      targetType: "ROOM",
      targetId: roomId,
    });
  }
}
