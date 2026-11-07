import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { UpdateOrganizationDTO } from "../dto/organizationDTO";

export class UpdateOrganizationUseCase implements IuseCase<UpdateOrganizationDTO, void> {
  constructor(
    private readonly organizationRepository: IorganizaionRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute({ organizationId, data }: UpdateOrganizationDTO): Promise<void> {
    await this.organizationRepository.updateOrganization(organizationId, data);

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "UPDATE_ORGANIZATION",
      actorId: null,
      organizationId,
      targetType: "ORGANIZATION",
      targetId: organizationId,
      metadata: {},
    });
  }
}
