import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { CreateRoomDTO } from "../dto/roomDTO";
import { IRoomDocument } from "../../infrastructure/roomSchema";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class CreateRoomUseCase
  implements IuseCase<CreateRoomDTO, void>
{
  constructor(
    private readonly roomRepository: IroomRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(data: CreateRoomDTO): Promise<void> {
    // Set private status based on room type
    data.isPrivate = data.type === "private";

    // Create room
    const room = await this.roomRepository.createRoom(
      data as unknown as IRoomDocument
    );
    console.log(room)

    // Record activity
    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),

      action: "ROOM_CREATED",

      actorId: data.createdBy,

      organizationId: data.organizationId,

      workspaceId: data.workspaceId,

      targetType: "ROOM",

      targetId: room._id.toString(),

      metadata: {
        roomName: data.name,

        roomType: data.type,

        isPrivate: data.isPrivate ?? false,
      },
    });
  }
}