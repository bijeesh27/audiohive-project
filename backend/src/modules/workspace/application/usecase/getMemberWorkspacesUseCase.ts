import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserRepository } from "../../../auth/domain/IuserRepository";
import { UserRoles } from "../../../../common/constant/userRoles";
import { AppError } from "../../../../common/Errors/AppError";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { getUserWorkspaceIds } from "../../../../shared/User.utils/workspaceMembership";

export interface GetMemberWorkspacesInput {
  userId: string;
}

export class GetMemberWorkspacesUseCase
  implements IuseCase<GetMemberWorkspacesInput, IWorkspaceDocument[]>
{
  constructor(
    private readonly userRepository: IuserRepository,
    private readonly workspaceRepository: IworkspaceRepository,
  ) {}

  async execute({ userId }: GetMemberWorkspacesInput): Promise<IWorkspaceDocument[]> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.role !== UserRoles.MEMBER || !user.status) {
      throw new AppError("Member account is unavailable", 403);
    }

    return this.workspaceRepository.getWorkspacesByIds(
      getUserWorkspaceIds(user),
      true,
    );
  }
}
