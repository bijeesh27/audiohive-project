import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { IroomRepository } from "../../domain/IroomRepository";
import { AllocateRoomUsersDTO } from "../dto/roomDTO";

export class AllocateRoomUsersUseCase
  implements IuseCase<AllocateRoomUsersDTO, void>
{
  constructor(
    private readonly roomRepository: IroomRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(data: AllocateRoomUsersDTO): Promise<void> {
    // Update allowed users in the room
    await this.roomRepository.updateAllowedUsers(
      data.roomId,
      data.userIds
    );

    // Record activity
    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),

      action: "ROOM_USERS_ALLOCATED",

      actorId: data.actorId,

      organizationId: data.organizationId,

      workspaceId: data.workspaceId,

      targetType: "ROOM",

      targetId: data.roomId,

      metadata: {
        userCount: data.userIds.length,
      },
    });
  }
}