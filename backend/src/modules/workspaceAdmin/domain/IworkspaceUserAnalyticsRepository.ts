import {
  GetWorkspaceUserAnalyticsInputDTO,
  WorkspaceUserAnalyticsResponseDTO,
  GetUserActivityHistoryInputDTO,
  UserActivityHistoryResponseDTO,
} from "../application/dtos/workspaceUserAnalyticsDTO";

export interface IWorkspaceUserAnalyticsRepository {
  getWorkspaceUserAnalytics(
    input: GetWorkspaceUserAnalyticsInputDTO
  ): Promise<WorkspaceUserAnalyticsResponseDTO>;

  getUserActivityHistory(
    input: GetUserActivityHistoryInputDTO
  ): Promise<UserActivityHistoryResponseDTO>;
}

