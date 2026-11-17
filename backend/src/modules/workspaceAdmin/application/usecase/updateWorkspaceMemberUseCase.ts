import { AppError } from "../../../../common/Errors/AppError";
import { MESSAGES } from "../../../../common/constant/messages";
import { UserRoles } from "../../../../common/constant/userRoles";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDTO } from "../../../../shared/User.utils/userDTO";
import { IuserRepository } from "../../domain/IuserRepository";

export interface UpdateWorkspaceMemberInput {
  userId: string;
  workspaceId: string;
  status?: boolean;
  role?: string;
}

export class UpdateWorkspaceMemberUseCase
  implements IuseCase<UpdateWorkspaceMemberInput, IuserDTO>
{
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(input: UpdateWorkspaceMemberInput): Promise<IuserDTO> {
    const dataToUpdate: Partial<IuserDTO> = {};

    if (input.status !== undefined) {
      if (typeof input.status !== "boolean") {
        throw new AppError("Invalid status value", 400);
      }
      dataToUpdate.status = input.status;
    }

    if (input.role !== undefined) {
      const allowedRoles = [UserRoles.MEMBER, UserRoles.WORKSPACE_ADMIN, "workspace-admin"];
      if (!allowedRoles.includes(input.role as UserRoles)) {
        throw new AppError("Invalid workspace role specified", 400);
      }
      dataToUpdate.role = input.role;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      throw new AppError("No valid fields provided to update", 400);
    }

    const user = await this.userRepository.updateUserInWorkspace(
      input.userId,
      input.workspaceId,
      dataToUpdate,
    );
    if (!user) throw new AppError(MESSAGES.ERRORS.MEMBER_NOT_ASSIGNED_TO_WORKSPACE, 404);
    return user;
  }
}
