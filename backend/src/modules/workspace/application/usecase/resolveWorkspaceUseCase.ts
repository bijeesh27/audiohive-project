import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IuserRepository } from "../../../auth/domain/IuserRepository";
import { UserRoles } from "../../../../common/constant/userRoles";
import { MESSAGES } from "../../../../common/constant/messages";
import { ResolveWorkspaceDTO, ResolvedWorkspaceDTO } from "../dto/workspaceDTOs";
import { getUserWorkspaceIds } from "../../../../shared/User.utils/workspaceMembership";
import { AppError } from "../../../../common/Errors/AppError";

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
      if (!user || !user.status) throw new AppError(MESSAGES.ERRORS.USER_NOT_IN_WORKSPACE, 403);
      const workspaceIds = getUserWorkspaceIds(user);
      const workspaceId = reqUser.activeWorkspaceId;
      if (!workspaceId || !workspaceIds.includes(workspaceId)) {
        throw new AppError(MESSAGES.ERRORS.USER_NOT_IN_WORKSPACE, 403);
      }
      const workspace = await this.workspaceRepository.getWorkspaceById(workspaceId);
      if (!workspace || workspace.status !== "active") {
        throw new AppError(MESSAGES.ERRORS.USER_NOT_IN_WORKSPACE, 403);
      }
      const organizationId = workspace.organizationId.toString();
      return { workspaceId, organizationId };
    }
  }
}
