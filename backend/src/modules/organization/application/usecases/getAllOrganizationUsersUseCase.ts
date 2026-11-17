import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { OrganizationNotFound } from "../../../../common/Errors/OrganizationError";
import { GetOrganizationUsersDTO, GetOrganizationUsersResultDTO } from "../dto/organizationDTO";

export class GetAllOrganizationUsersUseCase implements IuseCase<GetOrganizationUsersDTO, GetOrganizationUsersResultDTO> {
  constructor(private readonly organizationRepository: IorganizaionRepository) {}

  async execute(dto: GetOrganizationUsersDTO): Promise<GetOrganizationUsersResultDTO> {
    const organization = await this.organizationRepository.findByOwnerEmail(dto.ownerEmail);
    if (!organization) {
      throw new OrganizationNotFound();
    }

    return await this.organizationRepository.getUsersByOrganization(
      organization._id as unknown as string,
      {
        page: dto.page,
        limit: dto.limit,
        searchQuery: dto.search,
        workspaceId: dto.workspaceId,
        role: dto.role,
        status: dto.status,
        presence: dto.presence,
        sortField: dto.sortField,
        sortOrder: dto.sortOrder,
      }
    );
  }
}
