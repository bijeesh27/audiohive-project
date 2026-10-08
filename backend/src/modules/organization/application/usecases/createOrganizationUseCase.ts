
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { CreateOrganizationDTO } from "../dto/organizationDTO";
import crypto from "crypto";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class CreateOrganizationUseCase implements IuseCase<
  CreateOrganizationDTO,
  void
> {
  constructor(
    private readonly oragnizationRepository: IorganizaionRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}
  async execute(data: CreateOrganizationDTO) {
    const token = crypto.randomBytes(32).toString("hex");
    const organizationInvitation = {
      companyName: data.companyName,
      ownerName: data.ownerName,
      ownerEmail: data.ownerEmail,
      token: token,
    };
    // Only create the invitation record here.
    // The organization itself is created later, in SendOrganizationInvitationUseCase,
    // after the user has chosen and (if needed) paid for a plan.
    await this.oragnizationRepository.createInvitation(organizationInvitation);

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "ORGANIZATION_INVITATION_CREATED",
      actorId: data.actorId || null,
      organizationId: data.organizationId,
      workspaceId: data.workspaceId,
      targetType: "ORGANIZATION_INVITATION",
      targetId: undefined,
      metadata: { companyName: data.companyName, ownerEmail: data.ownerEmail }
    });
  }
}
