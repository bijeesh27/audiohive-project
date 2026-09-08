import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";

export class GetSuperAdminDashboardStatsUseCase
  implements IuseCase<void, { totalOrganizations: number; totalUsers: number }>
{
  constructor(private readonly userRepository: IuserRepository) {}

  async execute() {
    const [totalOrganizations, totalUsers] = await Promise.all([
      this.userRepository.getTotalOrganizations(),
      this.userRepository.getTotalUsers(),
    ]);
    return { totalOrganizations, totalUsers };
  }
}
