import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IWorkspaceUserAnalyticsRepository } from "../../domain/IworkspaceUserAnalyticsRepository";
import {
  GetWorkspaceDashboardInputDTO,
  WorkspaceDashboardResponseDTO,
} from "../dtos/workspaceDashboardDTO";

export class GetWorkspaceDashboardUseCase
  implements IuseCase<GetWorkspaceDashboardInputDTO, WorkspaceDashboardResponseDTO>
{
  constructor(
    private readonly analyticsRepository: IWorkspaceUserAnalyticsRepository
  ) {}

  async execute(
    input: GetWorkspaceDashboardInputDTO
  ): Promise<WorkspaceDashboardResponseDTO> {
    return await this.analyticsRepository.getWorkspaceDashboard(input);
  }
}

