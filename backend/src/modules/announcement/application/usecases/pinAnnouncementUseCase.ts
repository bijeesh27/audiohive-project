import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { PinAnnouncementInputDTO } from "../dto/announcementDTO.js";
import { socketService } from "../../../../socket/socketService.js";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents.js";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository.js";

export class PinAnnouncementUseCase
  implements IuseCase<PinAnnouncementInputDTO, void>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(input: PinAnnouncementInputDTO): Promise<void> {
    await this.announcementRepository.pinAnnouncement(input.id, input.isPinned);

    // Emit directly — guaranteed to fire as long as DB update succeeds
    socketService.emitToWorkspace(input.workspaceId, SOCKET_EVENTS.PIN_ANNOUNCEMENT, {
      announcementId: input.id,
      isPinned: input.isPinned,
    });
    
    await this.activityLogRepository.recordActivity({ 
      occurredAt: new Date(), 
      action: "ANNOUNCEMENT_PINNED", 
      actorId: input.actorId || null, 
      organizationId: input.organizationId, 
      workspaceId: input.workspaceId, 
      targetType: "Announcement", 
      targetId: input.id, 
      metadata: { isPinned: input.isPinned } 
    });
  }
}

