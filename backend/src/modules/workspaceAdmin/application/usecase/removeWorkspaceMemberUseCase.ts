import { AppError } from "../../../../common/Errors/AppError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDTO } from "../../../../shared/User.utils/userDTO";
import { IuserRepository } from "../../domain/IuserRepository";
import { getUserWorkspaceIds } from "../../../../shared/User.utils/workspaceMembership";

export interface RemoveWorkspaceMemberInput {
  userId: string;
  workspaceId: string;
}

export class RemoveWorkspaceMemberUseCase
  implements IuseCase<RemoveWorkspaceMemberInput, IuserDTO>
{
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(input: RemoveWorkspaceMemberInput): Promise<IuserDTO> {
    const existingUser = await this.userRepository.findUserById(input.userId);
    const workspaceIds = existingUser ? getUserWorkspaceIds(existingUser) : [];
    if (!existingUser || !workspaceIds.includes(input.workspaceId)) {
      throw new AppError("Member is not assigned to this workspace", 404);
    }
    if (workspaceIds.length === 1) {
      throw new AppError("Use the organization workspace manager to assign a replacement workspace before removing this member", 400);
    }

    const user = await this.userRepository.removeUserFromWorkspace(
      input.userId,
      input.workspaceId,
    );
    if (!user) throw new AppError("Member is not assigned to this workspace", 404);
    return user;
  }
}
