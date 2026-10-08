import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { AnnouncementResponseDTO, UpdateAnnouncementDTO } from "../dto/announcementDTO.js";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository.js";

export class UpdateAnnouncementUseCase
  implements IuseCase<{ id: string; data: UpdateAnnouncementDTO }, void>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(input: { id: string; data: UpdateAnnouncementDTO }): Promise<void> {
    await this.announcementRepository.updateAnnouncement(input.id, input.data as Partial<AnnouncementResponseDTO>);
    
    await this.activityLogRepository.recordActivity({ 
      occurredAt: new Date(), 
      action: "ANNOUNCEMENT_UPDATED", 
      actorId: input.data.actorId || null, 
      organizationId: input.data.organizationId, 
      workspaceId: input.data.workspaceId, 
      targetType: "Announcement", 
      targetId: input.id, 
      metadata: { changes: Object.keys(input.data) } 
    });
  }
}
