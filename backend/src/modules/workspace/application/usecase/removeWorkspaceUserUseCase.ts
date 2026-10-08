import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDocument } from "../../../../shared/User.utils/userSchema";
import { IuserRepository } from "../../../workspaceAdmin/domain/IuserRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { RemoveWorkspaceUserDTO } from "../dto/workspaceDTOs";

export class RemoveWorkspaceUserUseCase
  implements IuseCase<RemoveWorkspaceUserDTO, IuserDocument>
{
  constructor(private readonly userRepository: IuserRepository, private readonly activityLogRepository: IactivityLogRepository) {}

  async execute(
    data: RemoveWorkspaceUserDTO
  ): Promise<IuserDocument> {
    const { userId } = data;

    // We update the user to set their workspaceId to null
    // The repository handles pulling them from rooms
    const updateData: Partial<IuserDocument> = {
      workspaceId: null,
    };

    const updatedUser = await this.userRepository.updateUser(
      userId,
      updateData
    );

    if (!updatedUser) {
      throw new AppError("User not found or update failed", 404);
    }

      await this.activityLogRepository.recordActivity({
            occurredAt: new Date(),
            action: "REMOVE_WORKSPACE_USER",
            actorId: data ? (data as any).actorId || (data as any).userId || (data as any).uploaderId || null : null,
            organizationId: data ? (data as any).organizationId : undefined,
            workspaceId: data ? (data as any).workspaceId || (data as any).roomId : undefined,
            targetType: "REMOVE",
            targetId: undefined,
            metadata: {}
          });


    return updatedUser;
  }
}
