import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { SuperAdminDashboardStatsDTO } from "../dtos/SuperAdminDTO.ts";

export class GetSuperAdminDashboardStatsUseCase
  implements IuseCase<void, SuperAdminDashboardStatsDTO>
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
