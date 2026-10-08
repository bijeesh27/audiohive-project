import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IuserRepository } from "../../../auth/domain/IuserRepository";
import { UserRoles } from "../../../../common/constant/userRoles";
import { MESSAGES } from "../../../../common/constant/messages";
import { ResolveWorkspaceDTO, ResolvedWorkspaceDTO } from "../dto/workspaceDTOs";

export class ResolveWorkspaceUseCase implements IuseCase<ResolveWorkspaceDTO, ResolvedWorkspaceDTO> {
  constructor(
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly userRepository: IuserRepository
  ) {}

  async execute(reqUser: ResolveWorkspaceDTO): Promise<ResolvedWorkspaceDTO> {
    if (reqUser.role === UserRoles.WORKSPACE_ADMIN) {
      const workspace = reqUser.userEmail
        ? await this.workspaceRepository.findByAdminEmail(reqUser.userEmail)
        : null;
      if (!workspace) throw new Error(MESSAGES.ERRORS.WORKSPACE_ADMIN_NOT_FOUND);
      return {
        workspaceId: workspace._id.toString(),
        organizationId: workspace.organizationId.toString(),
      };
    } else {
      const user = reqUser.userId ? await this.userRepository.findById(reqUser.userId) : null;
      if (!user || !user.workspaceId) throw new Error(MESSAGES.ERRORS.USER_NOT_IN_WORKSPACE);
      const workspaceId = user.workspaceId.toString();
      const workspace = await this.workspaceRepository.getWorkspaceById(workspaceId);
      const organizationId = workspace?.organizationId?.toString() ?? "";
      return { workspaceId, organizationId };
    }
  }
}
