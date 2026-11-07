import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IOrganizationAnalyticsRepository } from "../../domain/IorganizationAnalyticsRepository";
import {
  GetOrganizationAnalyticsInputDTO,
  OrganizationAnalyticsResponseDTO,
} from "../dto/organizationAnalyticsDTO";

export class GetOrganizationAnalyticsUseCase
  implements IuseCase<GetOrganizationAnalyticsInputDTO, OrganizationAnalyticsResponseDTO>
{
  constructor(
    private readonly organizationAnalyticsRepository: IOrganizationAnalyticsRepository
  ) {}

  async execute(
    input: GetOrganizationAnalyticsInputDTO
  ): Promise<OrganizationAnalyticsResponseDTO> {
    return await this.organizationAnalyticsRepository.getOrganizationAnalytics(input);
  }
}

