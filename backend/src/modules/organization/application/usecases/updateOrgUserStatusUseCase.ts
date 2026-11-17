import { Types } from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { UserModel } from "../../../../shared/User.utils/userSchema";
import { WorkspaceModel } from "../../../workspace/infrastructure/workspaceSchema";
import { AppError } from "../../../../common/Errors/AppError";
import { HttpStatus } from "../../../../common/constant/httpStatus";
import { UserRoles } from "../../../../common/constant/userRoles";
import { UpdateOrgUserStatusDTO } from "../dto/organizationDTO";
import { getUserWorkspaceIds, buildWorkspaceMembershipQuery, WORKSPACE_MEMBER_ROLES } from "../../../../shared/User.utils/workspaceMembership";

export class UpdateOrgUserStatusUseCase implements IuseCase<UpdateOrgUserStatusDTO, { success: boolean; status: boolean }> {
  constructor(
    private readonly organizationRepository: IorganizaionRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(input: UpdateOrgUserStatusDTO): Promise<{ success: boolean; status: boolean }> {
    const org = await this.organizationRepository.findByOwnerEmail(input.ownerEmail);
    if (!org) {
      throw new AppError("Organization not found.", HttpStatus.NOT_FOUND);
    }

    const user = await UserModel.findById(input.userId);
    if (!user) {
      throw new AppError("User not found.", HttpStatus.NOT_FOUND);
    }

    // Block modifying organization owner's account
    if (
      user.email?.toLowerCase() === input.ownerEmail.toLowerCase() ||
      user.role === UserRoles.ORGANIZATION_OWNER ||
      user.email?.toLowerCase() === org.ownerEmail?.toLowerCase()
    ) {
      throw new AppError("The organization owner account cannot be disabled.", HttpStatus.FORBIDDEN);
    }

    // Get all workspaces for this organization
    const orgWorkspaces = await WorkspaceModel.find({ organizationId: org._id }).lean();
    const orgWorkspaceIdStrings = orgWorkspaces.map((w) => w._id.toString());

    // Verify user belongs to this organization
    const userWsIds = getUserWorkspaceIds(user);
    const inOrg = userWsIds.some((wsId) => orgWorkspaceIdStrings.includes(wsId));
    if (!inOrg) {
      throw new AppError("User does not belong to this organization.", HttpStatus.FORBIDDEN);
    }

    // If disabling user (status -> false), verify user is not the sole admin of any active workspace in the org
    if (input.status === false) {
      for (const ws of orgWorkspaces) {
        if (ws.status !== "active") continue;
        const isAssigned = userWsIds.includes(ws._id.toString());
        if (!isAssigned) continue;

        const isDesignatedAdmin = ws.workspaceAdminEmail?.toLowerCase() === user.email?.toLowerCase();
        
        // Count active admins in this workspace
        const wsQuery = {
          role: { $in: ["workspaceadmin", "workspace-admin", "admin"] },
          status: { $ne: false },
          ...buildWorkspaceMembershipQuery(ws._id.toString()),
        };
        const activeAdminsCount = await UserModel.countDocuments(wsQuery);

        if (isDesignatedAdmin || activeAdminsCount <= 1) {
          if (user.role?.toLowerCase() !== "member") {
            throw new AppError(
              `Cannot disable ${user.username} because they are the sole administrator of workspace "${ws.workspaceName}". Please assign another admin first.`,
              HttpStatus.BAD_REQUEST
            );
          }
        }
      }
    }

    user.status = input.status;
    await user.save();

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: input.status ? "MEMBER_STATUS_UNBLOCKED" : "MEMBER_STATUS_BLOCKED",
      actorId: input.actorId,
      actorRole: UserRoles.ORGANIZATION_OWNER,
      organizationId: org._id.toString(),
      targetType: "USER",
      targetId: user._id.toString(),
      metadata: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        newStatus: input.status,
      },
    });

    return { success: true, status: user.status };
  }
}
