import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { DeleteAnnouncementDTO } from "../dto/announcementDTO.js";
import { socketService } from "../../../../socket/socketService.js";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents.js";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository.js";

export class DeleteAnnouncementUseCase
  implements IuseCase<DeleteAnnouncementDTO, void>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(input: DeleteAnnouncementDTO): Promise<void> {
    await this.announcementRepository.deleteAnnouncement(input.id);

    // Emit directly — guaranteed to fire as long as DB delete succeeds
    socketService.emitToWorkspace(
      input.workspaceId,
      SOCKET_EVENTS.DELETE_ANNOUNCEMENT,
      { announcementId: input.id }
    );
    
    await this.activityLogRepository.recordActivity({ 
      occurredAt: new Date(), 
      action: "ANNOUNCEMENT_DELETED", 
      actorId: input.actorId || null, 
      organizationId: input.organizationId, 
      workspaceId: input.workspaceId, 
      targetType: "Announcement", 
      targetId: input.id, 
      metadata: {} 
    });
  }
}

