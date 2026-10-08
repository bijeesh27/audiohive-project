import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { RemoveRoomUserDTO } from "../dto/roomDTO";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class RemoveRoomUserUseCase implements IuseCase<RemoveRoomUserDTO, void> {
  constructor(
    private readonly roomRepository: IroomRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(data: RemoveRoomUserDTO): Promise<void> {
    await this.roomRepository.removeRoomUser(data.roomId, data.userId);
    
    await this.activityLogRepository.recordActivity({ 
      occurredAt: new Date(), 
      action: "ROOM_USER_REMOVED", 
      actorId: data.actorId || null, 
      organizationId: data.organizationId, 
      workspaceId: data.workspaceId, 
      targetType: "Room", 
      targetId: data.roomId, 
      metadata: { removedUserId: data.userId } 
    });
  }
}
