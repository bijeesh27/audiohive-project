import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { UserModel } from "../../../../shared/User.utils/userSchema";
import { WorkspaceModel } from "../../../workspace/infrastructure/workspaceSchema";
import { AppError } from "../../../../common/Errors/AppError";
import { HttpStatus } from "../../../../common/constant/httpStatus";
import { UserRoles } from "../../../../common/constant/userRoles";
import { UpdateOrgUserRoleDTO } from "../dto/organizationDTO";
import { getUserWorkspaceIds, buildWorkspaceMembershipQuery } from "../../../../shared/User.utils/workspaceMembership";

export class UpdateOrgUserRoleUseCase implements IuseCase<UpdateOrgUserRoleDTO, { success: boolean; role: string }> {
  constructor(
    private readonly organizationRepository: IorganizaionRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(input: UpdateOrgUserRoleDTO): Promise<{ success: boolean; role: string }> {
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
      throw new AppError("The organization owner account role cannot be changed.", HttpStatus.FORBIDDEN);
    }

    // Normalize role
    const rawRole = input.role?.toLowerCase() || "";
    let targetRole: string;
    if (rawRole === "admin" || rawRole === "workspaceadmin" || rawRole === "workspace-admin") {
      targetRole = UserRoles.WORKSPACE_ADMIN;
    } else if (rawRole === "member") {
      targetRole = UserRoles.MEMBER;
    } else {
      throw new AppError("Invalid role specified. Allowed roles are Admin or Member.", HttpStatus.BAD_REQUEST);
    }

    const orgWorkspaces = await WorkspaceModel.find({ organizationId: org._id }).lean();
    const orgWorkspaceIdStrings = orgWorkspaces.map((w) => w._id.toString());

    // Verify user belongs to this organization
    const userWsIds = getUserWorkspaceIds(user);
    const inOrg = userWsIds.some((wsId) => orgWorkspaceIdStrings.includes(wsId));
    if (!inOrg) {
      throw new AppError("User does not belong to this organization.", HttpStatus.FORBIDDEN);
    }

    // If demoting from admin to member, check if user is sole admin of any workspace
    if (targetRole === UserRoles.MEMBER && user.role !== UserRoles.MEMBER) {
      for (const ws of orgWorkspaces) {
        if (ws.status !== "active") continue;
        const isAssigned = userWsIds.includes(ws._id.toString());
        if (!isAssigned) continue;

        const isDesignatedAdmin = ws.workspaceAdminEmail?.toLowerCase() === user.email?.toLowerCase();
        const wsQuery = {
          role: { $in: ["workspaceadmin", "workspace-admin", "admin"] },
          status: { $ne: false },
          ...buildWorkspaceMembershipQuery(ws._id.toString()),
        };
        const adminsCount = await UserModel.countDocuments(wsQuery);

        if (isDesignatedAdmin || adminsCount <= 1) {
          throw new AppError(
            `Cannot demote ${user.username} because they are the sole administrator of workspace "${ws.workspaceName}". Please assign another admin first.`,
            HttpStatus.BAD_REQUEST
          );
        }
      }
    }

    user.role = targetRole;
    await user.save();

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "MEMBER_ROLE_UPDATED",
      actorId: input.actorId,
      actorRole: UserRoles.ORGANIZATION_OWNER,
      organizationId: org._id.toString(),
      targetType: "USER",
      targetId: user._id.toString(),
      metadata: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        newRole: targetRole,
      },
    });

    return { success: true, role: user.role };
  }
}
