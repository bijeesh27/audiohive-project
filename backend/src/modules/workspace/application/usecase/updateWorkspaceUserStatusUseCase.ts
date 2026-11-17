import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDTO } from "../../../../shared/User.utils/userDTO";
import { IuserRepository } from "../../../workspaceAdmin/domain/IuserRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { MESSAGES } from "../../../../common/constant/messages";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { UpdateWorkspaceUserStatusDTO } from "../dto/workspaceDTOs";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";

export class UpdateWorkspaceUserStatusUseCase implements IuseCase<UpdateWorkspaceUserStatusDTO, IuserDTO> {
  constructor(
    private readonly userRepository: IuserRepository,
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly organizationRepository: IorganizaionRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(data: UpdateWorkspaceUserStatusDTO): Promise<IuserDTO> {
    const { userId, workspaceId, status, ownerEmail, actorId } = data;

    const [organization, workspace, targetUser] = await Promise.all([
      this.organizationRepository.findByOwnerEmail(ownerEmail),
      this.workspaceRepository.getWorkspaceById(workspaceId),
      this.userRepository.findUserById(userId),
    ]);

    if (!organization || !workspace || workspace.organizationId.toString() !== organization._id.toString()) {
      throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, 403);
    }

    if (!targetUser) {
      throw new AppError(MESSAGES.ERRORS.USER_NOT_FOUND, 404);
    }

    // If disabling the user, check if they are the designated admin
    if (status === false && workspace.workspaceAdminEmail?.toLowerCase() === targetUser.email.toLowerCase()) {
      throw new AppError("Cannot disable the designated workspace administrator. Please assign another admin first.", 400);
    }

    const updatedUser = await this.userRepository.updateUserInWorkspace(userId, workspaceId, {
      status,
    });

    if (!updatedUser) {
      throw new AppError(MESSAGES.ERRORS.USER_NOT_FOUND_OR_UPDATE_FAILED, 404);
    }

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "CHANGE_WORKSPACE_USER_STATUS",
      actorId,
      organizationId: organization._id.toString(),
      workspaceId,
      targetType: "USER",
      targetId: userId,
      metadata: {
        newStatus: status ? "active" : "disabled",
        userEmail: targetUser.email,
      },
    });

    return updatedUser;
  }
}
