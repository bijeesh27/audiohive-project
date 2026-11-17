import {
  GetWorkspaceUserAnalyticsInputDTO,
  WorkspaceUserAnalyticsResponseDTO,
  GetUserActivityHistoryInputDTO,
  UserActivityHistoryResponseDTO,
} from "../application/dtos/workspaceUserAnalyticsDTO";
import {
  GetWorkspaceDashboardInputDTO,
  WorkspaceDashboardResponseDTO,
  GetWorkspaceMembersActivityInputDTO,
  WorkspaceMembersActivityResponseDTO,
} from "../application/dtos/workspaceDashboardDTO";

export interface IWorkspaceUserAnalyticsRepository {
  getWorkspaceUserAnalytics(
    input: GetWorkspaceUserAnalyticsInputDTO
  ): Promise<WorkspaceUserAnalyticsResponseDTO>;

  getUserActivityHistory(
    input: GetUserActivityHistoryInputDTO
  ): Promise<UserActivityHistoryResponseDTO>;

  getWorkspaceDashboard(
    input: GetWorkspaceDashboardInputDTO
  ): Promise<WorkspaceDashboardResponseDTO>;

  getWorkspaceMembersActivity(
    input: GetWorkspaceMembersActivityInputDTO
  ): Promise<WorkspaceMembersActivityResponseDTO>;
}

