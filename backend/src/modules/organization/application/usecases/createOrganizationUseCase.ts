import { API_ROUTES } from "../../../../common/constant/ApiRoutes";
import { emailQueue } from "../../../../config/queue.config";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IorganizationDocument } from "../../infrastructure/organizationSchema";
import { createOrganizationDTO } from "../dto/organizationDTO";
import crypto from "crypto";

export class CreateOrganizationUseCase implements IuseCase<
  createOrganizationDTO,
  void
> {
  constructor(
    private readonly oragnizationRepository: IorganizaionRepository,
  ) {}
  async execute(data: createOrganizationDTO) {
    console.log(data);
    const token = crypto.randomBytes(32).toString("hex");
    const organizationInvitation = {
      companyName: data.companyName,
      ownerName: data.ownerName,
      ownerEmail: data.ownerEmail,
      token: token,
    };
    await this.oragnizationRepository.createInvitation(organizationInvitation);
    const invitationLink = `${process.env.CLIENT_URL}${API_ROUTES.AUTH.REGISTER}?token=${token}`;

    await this.oragnizationRepository.createOrganization(data);
    await emailQueue.add("send-workspace-invitation", {
      to: data.ownerEmail,
      companyName: data.companyName,
      invitationLink,
    });
  }
}
