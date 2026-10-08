import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { DeleteOrganizationDTO } from "../dto/organizationDTO";

export class DeleteOrganizationUseCase implements IuseCase<DeleteOrganizationDTO, void> {
  constructor(
    private readonly organizationRepository: IorganizaionRepository, private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute({ organizationId }: DeleteOrganizationDTO): Promise<void> {
    await this.organizationRepository.deleteOrganization(organizationId);

      await this.activityLogRepository.recordActivity({
            occurredAt: new Date(),
            action: "DELETE_ORGANIZATION",
            actorId: organizationId ? (organizationId as any).actorId || (organizationId as any).userId || (organizationId as any).uploaderId || null : null,
            organizationId: organizationId ? (organizationId as any).organizationId : undefined,
            workspaceId: organizationId ? (organizationId as any).workspaceId || (organizationId as any).roomId : undefined,
            targetType: "DELETE",
            targetId: undefined,
            metadata: {}
          });
  }
}
