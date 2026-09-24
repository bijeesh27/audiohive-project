import { API_ROUTES } from "../../../../common/constant/ApiRoutes";
import { emailQueue } from "../../../../config/queue.config";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";

export class SendOrganizationInvitationUseCase implements IuseCase<string, void> {
  constructor(private readonly organizationRepository: IorganizaionRepository) {}

  async execute(ownerEmail: string) {
    const invitation = await this.organizationRepository.findInvitationByEmail(ownerEmail);
    if (!invitation) {
      throw new Error("Organization invitation not found");
    }

    const invitationLink = `${process.env.CLIENT_URL}${API_ROUTES.AUTH.REGISTER}?token=${invitation.token}`;

    await emailQueue.add("send-workspace-invitation", {
      to: invitation.ownerEmail,
      companyName: invitation.companyName,
      invitationLink,
    });
  }
}
