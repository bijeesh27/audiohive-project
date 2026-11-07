import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDTO } from "../../../../shared/User.utils/userDTO";
import { IuserRepository } from "../../../workspaceAdmin/domain/IuserRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { MESSAGES } from "../../../../common/constant/messages";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { RemoveWorkspaceUserDTO } from "../dto/workspaceDTOs";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";

export class RemoveWorkspaceUserUseCase
  implements IuseCase<RemoveWorkspaceUserDTO, IuserDTO>
{
  constructor(
    private readonly userRepository: IuserRepository,
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly organizationRepository: IorganizaionRepository,
    private readonly activityLogRepository: IactivityLogRepository,
  ) {}

  async execute(
    data: RemoveWorkspaceUserDTO
  ): Promise<IuserDTO> {
    const { userId, workspaceId } = data;
    const [organization, workspace] = await Promise.all([
      this.organizationRepository.findByOwnerEmail(data.ownerEmail),
      this.workspaceRepository.getWorkspaceById(workspaceId),
    ]);
    if (!organization || !workspace || workspace.organizationId.toString() !== organization._id.toString()) {
      throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED_REMOVE_WORKSPACE_MEMBERS, 403);
    }

    const updatedUser = await this.userRepository.removeUserFromWorkspace(userId, workspaceId);

    if (!updatedUser) {
      throw new AppError(MESSAGES.ERRORS.USER_NOT_FOUND_OR_UPDATE_FAILED, 404);
    }

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "REMOVE_WORKSPACE_USER",
      actorId: data.actorId,
      organizationId: organization._id.toString(),
      workspaceId,
      targetType: "USER",
      targetId: userId,
      metadata: {},
    });


    return updatedUser;
  }
}
