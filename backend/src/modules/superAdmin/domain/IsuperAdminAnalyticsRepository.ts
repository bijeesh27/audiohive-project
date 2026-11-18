import {
  SuperAdminDashboardQueryDTO,
  SuperAdminDashboardResponseDTO,
} from "../application/dtos/SuperAdminDashboardDTO.ts";

export interface IsuperAdminAnalyticsRepository {
  getDashboardAnalytics(
    query: SuperAdminDashboardQueryDTO
  ): Promise<SuperAdminDashboardResponseDTO>;
}
