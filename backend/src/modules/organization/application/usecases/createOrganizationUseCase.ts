import { API_ROUTES } from "../../../../common/constant/ApiRoutes";
import { emailQueue } from "../../../../config/queue.config";
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
    await this.oragnizationRepository.createInvitation(organizationInvitation);
    await this.oragnizationRepository.createOrganization(data);
  }
}
