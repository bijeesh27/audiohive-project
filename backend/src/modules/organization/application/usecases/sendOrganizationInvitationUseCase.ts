import { API_ROUTES } from "../../../../common/constant/ApiRoutes";
import { emailQueue } from "../../../../config/queue.config";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { SendOrganizationInvitationDTO } from "../dto/organizationDTO";

export class SendOrganizationInvitationUseCase implements IuseCase<SendOrganizationInvitationDTO, void> {
  constructor(
    private readonly organizationRepository: IorganizaionRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(input: SendOrganizationInvitationDTO) {
    const { ownerEmail, companyName, slug, ownerName, planId, actorId, workspaceId, organizationId } = input;

    const invitation = await this.organizationRepository.findInvitationByEmail(ownerEmail);
    if (!invitation) {
      throw new Error("Organization invitation not found");
    }

    // Create the organization in the database now that a plan has been confirmed.
    await this.organizationRepository.createOrganization({
      companyName,
      slug,
      ownerName,
      ownerEmail,
      ...(planId ? { planId } : {}),
    });

    const invitationLink = `${process.env.CLIENT_URL}${API_ROUTES.AUTH.REGISTER}?token=${invitation.token}`;

    await emailQueue.add("send-workspace-invitation", {
      to: invitation.ownerEmail,
      companyName: invitation.companyName,
      invitationLink,
    });

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "ORGANIZATION_CREATED",
      actorId: actorId || null,
      organizationId: organizationId,
      workspaceId: workspaceId,
      targetType: "ORGANIZATION",
      targetId: undefined,
      metadata: { companyName, ownerEmail, slug }
    });
  }
}
