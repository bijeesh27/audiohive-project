import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { AnnouncementResponseDTO, CreateAnnouncementDTO } from "../dto/announcementDTO.js";
import { socketService } from "../../../../socket/socketService.js";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents.js";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository.js";

export class CreateAnnouncementUseCase
  implements IuseCase<CreateAnnouncementDTO, AnnouncementResponseDTO>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(data: CreateAnnouncementDTO): Promise<AnnouncementResponseDTO> {
    const saved = await this.announcementRepository.createAnnouncement(
      data as unknown as Partial<AnnouncementResponseDTO>
    );

    if (data.status === "published") {
      socketService.emitToWorkspace(
        data.workspaceId,
        SOCKET_EVENTS.NEW_ANNOUNCEMENT,
        saved
      );
    }
    
    await this.activityLogRepository.recordActivity({ 
      occurredAt: new Date(), 
      action: "ANNOUNCEMENT_CREATED", 
      actorId: data.createdBy, 
      organizationId: data.organizationId, 
      workspaceId: data.workspaceId, 
      targetType: "Announcement", 
      targetId: saved.id || (saved as any)._id, 
      metadata: { title: data.title } 
    });

    return saved;
  }
}

