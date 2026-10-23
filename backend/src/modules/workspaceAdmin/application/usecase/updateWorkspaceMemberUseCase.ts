import { AppError } from "../../../../common/Errors/AppError";
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
    if (!user) throw new AppError("Member is not assigned to this workspace", 404);
    return user;
  }
}
