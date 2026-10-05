
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
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
  }
}
