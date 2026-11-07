import { AppError } from "../../../../common/Errors/AppError";
import { MESSAGES } from "../../../../common/constant/messages";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDTO } from "../../../../shared/User.utils/userDTO";
import { IuserRepository } from "../../domain/IuserRepository";

export interface UpdateWorkspaceMemberInput {
  userId: string;
  workspaceId: string;
  status: boolean;
}

export class UpdateWorkspaceMemberUseCase
  implements IuseCase<UpdateWorkspaceMemberInput, IuserDTO>
{
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(input: UpdateWorkspaceMemberInput): Promise<IuserDTO> {
    const user = await this.userRepository.updateUserInWorkspace(
      input.userId,
      input.workspaceId,
      { status: input.status },
    );
    if (!user) throw new AppError(MESSAGES.ERRORS.MEMBER_NOT_ASSIGNED_TO_WORKSPACE, 404);
    return user;
  }
}
