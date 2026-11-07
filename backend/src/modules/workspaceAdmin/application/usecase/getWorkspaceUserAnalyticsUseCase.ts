import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IWorkspaceUserAnalyticsRepository } from "../../domain/IworkspaceUserAnalyticsRepository";
import {
  GetWorkspaceUserAnalyticsInputDTO,
  WorkspaceUserAnalyticsResponseDTO,
} from "../dtos/workspaceUserAnalyticsDTO";

export class GetWorkspaceUserAnalyticsUseCase
  implements IuseCase<GetWorkspaceUserAnalyticsInputDTO, WorkspaceUserAnalyticsResponseDTO>
{
  constructor(
    private readonly workspaceUserAnalyticsRepository: IWorkspaceUserAnalyticsRepository
  ) {}

  async execute(
    input: GetWorkspaceUserAnalyticsInputDTO
  ): Promise<WorkspaceUserAnalyticsResponseDTO> {
    return await this.workspaceUserAnalyticsRepository.getWorkspaceUserAnalytics(input);
  }
}

