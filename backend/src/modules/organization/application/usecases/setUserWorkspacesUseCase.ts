import mongoose from "mongoose";
import { AppError } from "../../../../common/Errors/AppError";
import { UserRoles } from "../../../../common/constant/userRoles";
import { MESSAGES } from "../../../../common/constant/messages";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { getUserWorkspaceIds } from "../../../../shared/User.utils/workspaceMembership";
import { IuserDTO } from "../../../../shared/User.utils/userDTO";
import { IuserRepository as IWorkspaceUserRepository } from "../../../workspaceAdmin/domain/IuserRepository";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository";
import { SetUserWorkspacesDTO } from "../dto/organizationDTO";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class SetUserWorkspacesUseCase
  implements IuseCase<SetUserWorkspacesDTO, IuserDTO>
{
  constructor(
    private readonly organizationRepository: IorganizaionRepository,
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly userRepository: IWorkspaceUserRepository,
    private readonly activityLogRepository: IactivityLogRepository,
  ) {}

  async execute(input: SetUserWorkspacesDTO): Promise<IuserDTO> {
    const organization = await this.organizationRepository.findByOwnerEmail(input.ownerEmail);
    if (!organization) throw new AppError(MESSAGES.ERRORS.ORANIZATION_NOT_FOUND, 404);

    const user = await this.userRepository.findUserById(input.userId);
    if (!user) {
      throw new AppError(MESSAGES.ERRORS.MEMBER_NOT_FOUND, 404);
    }
    if (user.role === UserRoles.ORGANIZATION_OWNER || user.email?.toLowerCase() === input.ownerEmail.toLowerCase()) {
      throw new AppError("Cannot change workspaces for the organization owner.", 403);
    }

    const existingWorkspaces = await this.workspaceRepository.getWorkspacesByIds(
      getUserWorkspaceIds(user),
    );
    const existingOrganizationWorkspaceIds = existingWorkspaces
      .filter((workspace) => workspace.organizationId.toString() === organization._id.toString())
      .map((workspace) => workspace._id.toString());
    if (existingOrganizationWorkspaceIds.length === 0) {
      throw new AppError(MESSAGES.ERRORS.MEMBER_NOT_IN_ORGANIZATION, 403);
    }

    const workspaceIds = Array.from(new Set(input.workspaceIds));
    if (workspaceIds.length === 0) {
      throw new AppError(MESSAGES.ERRORS.MEMBER_MUST_HAVE_WORKSPACE, 400);
    }
    if (workspaceIds.some((id) => !mongoose.isValidObjectId(id))) {
      throw new AppError(MESSAGES.ERRORS.INVALID_WORKSPACE_IDS, 400);
    }

    // Check if user is being removed from a workspace where they are the designated admin or sole admin
    const removedWsIds = existingOrganizationWorkspaceIds.filter((id) => !workspaceIds.includes(id));
    if (removedWsIds.length > 0) {
      for (const removedId of removedWsIds) {
        const ws = existingWorkspaces.find((w) => w._id.toString() === removedId);
        if (ws) {
          const isDesignatedAdmin = ws.workspaceAdminEmail?.toLowerCase() === user.email?.toLowerCase();
          if (isDesignatedAdmin) {
            throw new AppError(
              `Cannot remove user from workspace "${ws.workspaceName}" because they are the designated administrator. Assign another admin first.`,
              400
            );
          }
        }
      }
    }

    const selectedWorkspaces = await this.workspaceRepository.getWorkspacesByIds(
      workspaceIds,
      true,
    );
    if (
      selectedWorkspaces.length !== workspaceIds.length ||
      selectedWorkspaces.some(
        (workspace) => workspace.organizationId.toString() !== organization._id.toString(),
      )
    ) {
      throw new AppError(MESSAGES.ERRORS.CHOOSE_ACTIVE_WORKSPACES, 403);
    }

    const workspacesOutsideThisOrganization = getUserWorkspaceIds(user).filter(
      (currentId) => !existingOrganizationWorkspaceIds.includes(currentId),
    );
    const updated = await this.userRepository.setUserWorkspaceIds(
      input.userId,
      [...workspacesOutsideThisOrganization, ...workspaceIds],
    );
    if (!updated) throw new AppError(MESSAGES.ERRORS.MEMBER_UPDATE_FAILED, 404);

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "UPDATE_MEMBER_WORKSPACES",
      actorId: input.actorId,
      actorRole: UserRoles.ORGANIZATION_OWNER,
      organizationId: organization._id.toString(),
      workspaceId: workspaceIds[0],
      targetType: "USER",
      targetId: input.userId,
      metadata: { workspaceIds: JSON.stringify(workspaceIds) },
    });
    return updated;
  }
}
