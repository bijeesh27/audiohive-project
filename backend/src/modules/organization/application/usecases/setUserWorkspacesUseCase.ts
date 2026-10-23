import mongoose from "mongoose";
import { AppError } from "../../../../common/Errors/AppError";
import { UserRoles } from "../../../../common/constant/userRoles";
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
    if (!organization) throw new AppError("Organization not found", 404);

    const user = await this.userRepository.findUserById(input.userId);
    if (!user || user.role !== UserRoles.MEMBER) {
      throw new AppError("Member not found", 404);
    }

    const existingWorkspaces = await this.workspaceRepository.getWorkspacesByIds(
      getUserWorkspaceIds(user),
    );
    const existingOrganizationWorkspaceIds = existingWorkspaces
      .filter((workspace) => workspace.organizationId.toString() === organization._id.toString())
      .map((workspace) => workspace._id.toString());
    if (existingOrganizationWorkspaceIds.length === 0) {
      throw new AppError("Member does not belong to this organization", 403);
    }

    const workspaceIds = Array.from(new Set(input.workspaceIds));
    if (workspaceIds.length === 0) {
      throw new AppError("A member must have at least one workspace", 400);
    }
    if (workspaceIds.some((id) => !mongoose.isValidObjectId(id))) {
      throw new AppError("One or more workspace IDs are invalid", 400);
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
      throw new AppError("Choose active workspaces from your organization", 403);
    }

    const workspacesOutsideThisOrganization = getUserWorkspaceIds(user).filter(
      (currentId) => !existingOrganizationWorkspaceIds.includes(currentId),
    );
    const updated = await this.userRepository.setUserWorkspaceIds(
      input.userId,
      [...workspacesOutsideThisOrganization, ...workspaceIds],
    );
    if (!updated) throw new AppError("Member update failed", 404);

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
