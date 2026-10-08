import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IorganizaionRepository } from "../../domain/IorganizationRepository.ts";
import { GetOrgDashboardStatsDTO, OrgDashboardStatsDTO } from "../dto/organizationDTO";

export class GetOrgDashboardStatsUseCase
  implements IuseCase<GetOrgDashboardStatsDTO, OrgDashboardStatsDTO>
{
  constructor(private readonly organizationRepository: IorganizaionRepository) {}

  async execute({ ownerEmail }: GetOrgDashboardStatsDTO): Promise<OrgDashboardStatsDTO> {
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
