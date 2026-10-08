import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { MarkReadDTO } from "../dto/announcementDTO.js";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class MarkAsReadUseCase implements IuseCase<MarkReadDTO, void> {
  constructor(
    private readonly announcementRepository: IAnnouncementRepository, private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(input: MarkReadDTO): Promise<void> {
    await this.announcementRepository.markAsRead(
      input.announcementId,
      input.userId
    );

      await this.activityLogRepository.recordActivity({
            occurredAt: new Date(),
            action: "MARK_AS_READ",
            actorId: input ? (input as any).actorId || (input as any).userId || (input as any).uploaderId || null : null,
            organizationId: input ? (input as any).organizationId : undefined,
            workspaceId: input ? (input as any).workspaceId || (input as any).roomId : undefined,
            targetType: "MARK",
            targetId: undefined,
            metadata: {}
          });
  }
}
