import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IsuperAdminAnalyticsRepository } from "../../domain/IsuperAdminAnalyticsRepository.ts";
import {
  SuperAdminDashboardQueryDTO,
  SuperAdminDashboardResponseDTO,
} from "../dtos/SuperAdminDashboardDTO.ts";

export class GetSuperAdminDashboardAnalyticsUseCase
  implements IuseCase<SuperAdminDashboardQueryDTO, SuperAdminDashboardResponseDTO>
{
  constructor(
    private readonly analyticsRepository: IsuperAdminAnalyticsRepository
  ) {}

  async execute(
    query: SuperAdminDashboardQueryDTO
  ): Promise<SuperAdminDashboardResponseDTO> {
    return await this.analyticsRepository.getDashboardAnalytics(query);
  }
}
