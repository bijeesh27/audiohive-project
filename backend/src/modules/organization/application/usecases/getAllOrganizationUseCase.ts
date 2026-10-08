import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { GetAllOrganizationsDTO, GetAllOrganizationsResultDTO } from "../dto/organizationDTO";

export class GetAllOrganizationUseCase implements IuseCase<
  GetAllOrganizationsDTO,
  GetAllOrganizationsResultDTO
> {
  constructor(
    private readonly organizationRepository: IorganizaionRepository,
  ) {}

  async execute(
    data: GetAllOrganizationsDTO,
  ): Promise<GetAllOrganizationsResultDTO> {
    return await this.organizationRepository.getAllorganizations(
      data.page,
      data.limit,
      data.search,
      data.sort,
    );
  }
}
