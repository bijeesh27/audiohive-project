import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IWorkspaceUserAnalyticsRepository } from "../../domain/IworkspaceUserAnalyticsRepository";
import {
  GetUserActivityHistoryInputDTO,
  UserActivityHistoryResponseDTO,
} from "../dtos/workspaceUserAnalyticsDTO";

export class GetUserActivityHistoryUseCase
  implements IuseCase<GetUserActivityHistoryInputDTO, UserActivityHistoryResponseDTO>
{
  constructor(
    private readonly workspaceUserAnalyticsRepository: IWorkspaceUserAnalyticsRepository
  ) {}

  async execute(
    input: GetUserActivityHistoryInputDTO
  ): Promise<UserActivityHistoryResponseDTO> {
    return await this.workspaceUserAnalyticsRepository.getUserActivityHistory(input);
  }
}

