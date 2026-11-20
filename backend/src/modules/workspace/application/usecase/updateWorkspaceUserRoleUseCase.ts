import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDTO } from "../../../../shared/User.utils/userDTO";
import { IuserRepository } from "../../../workspaceAdmin/domain/IuserRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { MESSAGES } from "../../../../common/constant/messages";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { UpdateWorkspaceUserRoleDTO } from "../dto/workspaceDTOs";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";

export class UpdateWorkspaceUserRoleUseCase implements IuseCase<UpdateWorkspaceUserRoleDTO, IuserDTO> {
  constructor(
    private readonly userRepository: IuserRepository,
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly organizationRepository: IorganizaionRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(data: UpdateWorkspaceUserRoleDTO): Promise<IuserDTO> {
    const { userId, workspaceId, role, ownerEmail, actorId } = data;

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

    const normalizedRole = role.toLowerCase().trim();
    if (!["member", "workspaceadmin", "workspace-admin"].includes(normalizedRole)) {
      throw new AppError("Invalid role. Role must be either member or workspaceadmin.", 400);
    }

    // If demoting an admin to member, check if they are the designated admin
    if (normalizedRole === "member" && workspace.workspaceAdminEmail?.toLowerCase() === targetUser.email.toLowerCase()) {
      throw new AppError("Cannot demote the designated workspace administrator. Please assign another admin first.", 400);
    }

    const updatedUser = await this.userRepository.updateUserInWorkspace(userId, workspaceId, {
      role: normalizedRole,
    });

    if (!updatedUser) {
      throw new AppError(MESSAGES.ERRORS.USER_NOT_FOUND_OR_UPDATE_FAILED, 404);
    }

    // If making admin, update workspaceAdminEmail
    if (normalizedRole === "workspaceadmin" || normalizedRole === "workspace-admin") {
      await this.workspaceRepository.updateWorkspace(workspaceId, {
        workspaceAdminEmail: targetUser.email,
      });
    }

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "CHANGE_WORKSPACE_USER_ROLE",
      actorId,
      organizationId: organization._id.toString(),
      workspaceId,
      targetType: "USER",
      targetId: userId,
      metadata: {
        newRole: normalizedRole,
        previousRole: targetUser.role,
        userEmail: targetUser.email,
      },
    });

    return updatedUser;
  }
}
