import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IorganizaionRepository } from "../../domain/IorganizationRepository.ts";

export class GetOrgDashboardStatsUseCase
  implements IuseCase<string, { totalWorkspaces: number; totalUsers: number }>
{
  constructor(private readonly organizationRepository: IorganizaionRepository) {}

  async execute(ownerEmail: string) {
    const org = await this.organizationRepository.findByOwnerEmail(ownerEmail);
    if (!org) return { totalWorkspaces: 0, totalUsers: 0 };

    const orgId = org._id.toString();
    const [totalWorkspaces, totalUsers] = await Promise.all([
      this.organizationRepository.getTotalWorkspacesByOrg(orgId),
      this.organizationRepository.getTotalUsersByOrg(orgId),
    ]);

    return { totalWorkspaces, totalUsers };
  }
}
