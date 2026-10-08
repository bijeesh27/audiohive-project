import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { IRoomDocument } from "../../infrastructure/roomSchema";
import { UpdateRoomRequestDTO } from "../dto/roomDTO";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class UpdateRoomUseCase implements IuseCase<UpdateRoomRequestDTO, void> {
  constructor(
    private readonly roomRepository: IroomRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute({ roomId, data }: UpdateRoomRequestDTO): Promise<void> {
    if (data.type === "private") {
      data.isPrivate = true;
    } else if (data.type === "public") {
      data.isPrivate = false;
    }
    await this.roomRepository.updateRoom(roomId, data as Partial<IRoomDocument>);
    
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
