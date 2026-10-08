import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { UpdateOrganizationDTO } from "../dto/organizationDTO";

export class UpdateOrganizationUseCase implements IuseCase<UpdateOrganizationDTO, void> {
  constructor(
    private readonly organizationRepository: IorganizaionRepository, private readonly activityLogRepository: IactivityLogRepository
  ) {}
  async execute({ organizationId, data }: UpdateOrganizationDTO): Promise<void> {
    await this.organizationRepository.updateOrganization(organizationId, data);

      await this.activityLogRepository.recordActivity({
            occurredAt: new Date(),
            action: "UPDATE_ORGANIZATION",
            actorId: { organizationId, data } ? ({ organizationId, data } as any).actorId || ({ organizationId, data } as any).userId || ({ organizationId, data } as any).uploaderId || null : null,
            organizationId: { organizationId, data } ? ({ organizationId, data } as any).organizationId : undefined,
            workspaceId: { organizationId, data } ? ({ organizationId, data } as any).workspaceId || ({ organizationId, data } as any).roomId : undefined,
            targetType: "UPDATE",
            targetId: undefined,
            metadata: {}
          });
  }
}
