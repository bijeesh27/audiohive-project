import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IorganizationDocument } from "../../infrastructure/organizationSchema";

interface GetAllOrganizationInput {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
}

interface GetAllOrganizationOutput {
  organizations: IorganizationDocument[];
  total: number;
}

export class GetAllOrganizationUseCase implements IuseCase<
  GetAllOrganizationInput,
  GetAllOrganizationOutput
> {
  constructor(
    private readonly organizationRepository: IorganizaionRepository,
  ) {}

  async execute(
    data: GetAllOrganizationInput,
  ): Promise<GetAllOrganizationOutput> {
    return await this.organizationRepository.getAllorganizations(
      data.page,
      data.limit,
      data.search,
      data.sort,
    );
  }
}
