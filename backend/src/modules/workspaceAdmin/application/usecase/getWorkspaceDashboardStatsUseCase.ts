import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";

export class GetWorkspaceDashboardStatsUseCase
  implements IuseCase<string, { totalRooms: number; totalUsers: number }>
{
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(workspaceId: string) {
    return await this.userRepository.getDashboardStats(workspaceId);
  }
}
