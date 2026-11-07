import {
  GetOrganizationAnalyticsInputDTO,
  OrganizationAnalyticsResponseDTO,
} from "../application/dto/organizationAnalyticsDTO";

export interface IOrganizationAnalyticsRepository {
  getOrganizationAnalytics(
    input: GetOrganizationAnalyticsInputDTO
  ): Promise<OrganizationAnalyticsResponseDTO>;
}

