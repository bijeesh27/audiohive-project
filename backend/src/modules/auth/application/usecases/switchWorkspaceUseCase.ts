import { AppError } from "../../../../common/Errors/AppError";
import { UserRoles } from "../../../../common/constant/userRoles";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { getUserWorkspaceIds } from "../../../../shared/User.utils/workspaceMembership";
import { IuserDTO } from "../../../../shared/User.utils/userDTO";
import { IuserRepository } from "../../domain/IuserRepository";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository";

export interface SwitchWorkspaceInput {
  userId: string;
  workspaceId: string;
}

export interface SwitchWorkspaceResult {
  user: IuserDTO;
  workspaceId: string;
}

export class SwitchWorkspaceUseCase
  implements IuseCase<SwitchWorkspaceInput, SwitchWorkspaceResult>
{
  constructor(
    private readonly userRepository: IuserRepository,
    private readonly workspaceRepository: IworkspaceRepository,
  ) {}

  async execute(input: SwitchWorkspaceInput): Promise<SwitchWorkspaceResult> {
    const user = await this.userRepository.findById(input.userId);
    if (
      !user ||
      !user.status ||
      user.role !== UserRoles.MEMBER ||
      !getUserWorkspaceIds(user).includes(input.workspaceId)
    ) {
      throw new AppError("You do not have access to this workspace", 403);
    }

    const workspace = await this.workspaceRepository.getWorkspaceById(input.workspaceId);
    if (!workspace || workspace.status !== "active") {
      throw new AppError("Workspace is unavailable", 403);
    }

    return { user, workspaceId: workspace._id.toString() };
  }
}
