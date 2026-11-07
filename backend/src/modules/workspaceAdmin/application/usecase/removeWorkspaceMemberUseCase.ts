import { AppError } from "../../../../common/Errors/AppError";
import { MESSAGES } from "../../../../common/constant/messages";
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
      throw new AppError(MESSAGES.ERRORS.MEMBER_NOT_ASSIGNED_TO_WORKSPACE, 404);
    }
    if (workspaceIds.length === 1) {
      throw new AppError(MESSAGES.ERRORS.REPLACEMENT_WORKSPACE_REQUIRED, 400);
    }

    const user = await this.userRepository.removeUserFromWorkspace(
      input.userId,
      input.workspaceId,
    );
    if (!user) throw new AppError(MESSAGES.ERRORS.MEMBER_NOT_ASSIGNED_TO_WORKSPACE, 404);
    return user;
  }
}
