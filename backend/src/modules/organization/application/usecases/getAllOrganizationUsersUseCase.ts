import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { OrganizationNotFound } from "../../../../common/Errors/OrganizationError";

export class GetAllOrganizationUsersUseCase {
  constructor(private readonly organizationRepository: IorganizaionRepository) {}

  async execute(ownerEmail: string, page: number, limit: number, searchQuery?: string) {
    const organization = await this.organizationRepository.findByOwnerEmail(ownerEmail);
    if (!organization) {
      throw new OrganizationNotFound()
    }

    return await this.organizationRepository.getUsersByOrganization(
      organization._id as unknown as string,
      page,
      limit,
      searchQuery
    );
  }
}
