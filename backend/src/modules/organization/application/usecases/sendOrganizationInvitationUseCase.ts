import { API_ROUTES } from "../../../../common/constant/ApiRoutes";
import { emailQueue } from "../../../../config/queue.config";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";

export interface SendInvitationDTO {
  ownerEmail: string;
  /** Full org data required to create the organization record. */
  companyName: string;
  slug: string;
  ownerName: string;
  /** The subscription plan ID to associate with the organization. */
  planId?: string;
}

export class SendOrganizationInvitationUseCase implements IuseCase<SendInvitationDTO, void> {
  constructor(private readonly organizationRepository: IorganizaionRepository) {}

  async execute(input: SendInvitationDTO) {
    const { ownerEmail, companyName, slug, ownerName, planId } = input;

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
  }
}
