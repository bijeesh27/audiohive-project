import { Types } from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { UserModel } from "../../../../shared/User.utils/userSchema";
import { WorkspaceModel } from "../../../workspace/infrastructure/workspaceSchema";
import { RoomModel } from "../../../room/infrastructure/roomSchema";
import { AppError } from "../../../../common/Errors/AppError";
import { HttpStatus } from "../../../../common/constant/httpStatus";
import { UserRoles } from "../../../../common/constant/userRoles";
import { RemoveOrgUserDTO } from "../dto/organizationDTO";
import { getUserWorkspaceIds, buildWorkspaceMembershipQuery } from "../../../../shared/User.utils/workspaceMembership";

export class RemoveOrgUserUseCase implements IuseCase<RemoveOrgUserDTO, { success: boolean; message: string }> {
  constructor(
    private readonly organizationRepository: IorganizaionRepository,
    private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(input: RemoveOrgUserDTO): Promise<{ success: boolean; message: string }> {
    const org = await this.organizationRepository.findByOwnerEmail(input.ownerEmail);
    if (!org) {
      throw new AppError("Organization not found.", HttpStatus.NOT_FOUND);
    }

    const user = await UserModel.findById(input.userId);
    if (!user) {
      throw new AppError("User not found.", HttpStatus.NOT_FOUND);
    }

    // Block removing organization owner's account
    if (
      user.email?.toLowerCase() === input.ownerEmail.toLowerCase() ||
      user.role === UserRoles.ORGANIZATION_OWNER ||
      user.email?.toLowerCase() === org.ownerEmail?.toLowerCase()
    ) {
      throw new AppError("The organization owner account cannot be removed.", HttpStatus.FORBIDDEN);
    }

    const orgWorkspaces = await WorkspaceModel.find({ organizationId: org._id }).lean();
    const orgWorkspaceIdStrings = orgWorkspaces.map((w) => w._id.toString());
    const orgWorkspaceObjIds = orgWorkspaces.map((w) => w._id);

    // Verify user belongs to this organization
    const userWsIds = getUserWorkspaceIds(user);
    const inOrg = userWsIds.some((wsId) => orgWorkspaceIdStrings.includes(wsId));
    if (!inOrg) {
      throw new AppError("User does not belong to this organization.", HttpStatus.FORBIDDEN);
    }

    // Check if user is sole admin of any workspace in the organization
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

      if (isDesignatedAdmin || (user.role?.toLowerCase() !== "member" && adminsCount <= 1)) {
        throw new AppError(
          `Cannot remove ${user.username} from the organization because they are the sole administrator of workspace "${ws.workspaceName}". Please assign another admin first.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Pull organization workspace IDs from user
    const remainingWorkspaceIds = (user.workspaceIds || []).filter((id: unknown) => {
      const idStr = id ? (id as Types.ObjectId).toString() : "";
      return !orgWorkspaceIdStrings.includes(idStr);
    });
    user.workspaceIds = remainingWorkspaceIds as unknown as Types.ObjectId[];

    if (user.workspaceId && orgWorkspaceIdStrings.includes(user.workspaceId.toString())) {
      user.workspaceId = undefined as unknown as Types.ObjectId;
    }

    await user.save();

    // Pull user from room allowedUsers in org workspaces
    await RoomModel.updateMany(
      {
        $or: [
          { workspaceId: { $in: orgWorkspaceIdStrings } },
          { workspaceId: { $in: orgWorkspaceObjIds } },
        ],
      },
      {
        $pull: { allowedUsers: user._id },
      }
    );

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "MEMBER_REMOVED_FROM_ORGANIZATION",
      actorId: input.actorId,
      actorRole: UserRoles.ORGANIZATION_OWNER,
      organizationId: org._id.toString(),
      targetType: "USER",
      targetId: user._id.toString(),
      metadata: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });

    return { success: true, message: `${user.username} was removed from the organization.` };
  }
}
