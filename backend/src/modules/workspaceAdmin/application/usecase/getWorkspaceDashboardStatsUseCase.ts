import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { WorkspaceDashboardStatsDTO } from "../dtos/workspaceAdminDTO.ts";

export class GetWorkspaceDashboardStatsUseCase
  implements IuseCase<string, WorkspaceDashboardStatsDTO>
{
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(workspaceId: string) {
    return await this.userRepository.getDashboardStats(workspaceId);
  }
}

