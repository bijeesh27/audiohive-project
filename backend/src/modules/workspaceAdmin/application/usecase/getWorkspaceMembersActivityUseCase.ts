import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IWorkspaceUserAnalyticsRepository } from "../../domain/IworkspaceUserAnalyticsRepository";
import {
  GetWorkspaceMembersActivityInputDTO,
  WorkspaceMembersActivityResponseDTO,
} from "../dtos/workspaceDashboardDTO";

export class GetWorkspaceMembersActivityUseCase
  implements
    IuseCase<
      GetWorkspaceMembersActivityInputDTO,
      WorkspaceMembersActivityResponseDTO
    >
{
  constructor(
    private readonly analyticsRepository: IWorkspaceUserAnalyticsRepository
  ) {}

  async execute(
    input: GetWorkspaceMembersActivityInputDTO
  ): Promise<WorkspaceMembersActivityResponseDTO> {
    return await this.analyticsRepository.getWorkspaceMembersActivity(input);
  }
}

