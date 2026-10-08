import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { OrganizationNotFound } from "../../../../common/Errors/OrganizationError";
import { GetOrganizationUsersDTO, GetOrganizationUsersResultDTO } from "../dto/organizationDTO";

export class GetAllOrganizationUsersUseCase implements IuseCase<GetOrganizationUsersDTO, GetOrganizationUsersResultDTO> {
  constructor(private readonly organizationRepository: IorganizaionRepository) {}

  async execute({ ownerEmail, page, limit, search }: GetOrganizationUsersDTO): Promise<GetOrganizationUsersResultDTO> {
    const organization = await this.organizationRepository.findByOwnerEmail(ownerEmail);
    if (!organization) {
      throw new OrganizationNotFound();
    }

    return await this.organizationRepository.getUsersByOrganization(
      organization._id as unknown as string,
      page,
      limit,
      search
    );
  }
}
