import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDTO } from "../../../../shared/User.utils/userDTO";
import { IuserRepository } from "../../../workspaceAdmin/domain/IuserRepository";
import { GetWorkspaceUsersDTO } from "../dto/workspaceDTOs";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { MESSAGES } from "../../../../common/constant/messages";

export class GetWorkspaceUsersUseCase implements IuseCase<GetWorkspaceUsersDTO, { users: IuserDTO[]; total: number } | null> {
  constructor(
    private readonly userRepository: IuserRepository,
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly organizationRepository: IorganizaionRepository,
  ) {}

  async execute(data: GetWorkspaceUsersDTO) {
    const [organization, workspace] = await Promise.all([
      this.organizationRepository.findByOwnerEmail(data.ownerEmail),
      this.workspaceRepository.getWorkspaceById(data.workspaceId),
    ]);
    if (!organization || !workspace || workspace.organizationId.toString() !== organization._id.toString()) {
      throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED_VIEW_WORKSPACE_MEMBERS, 403);
    }
    return await this.userRepository.getAllUsers(data.workspaceId, data.page, data.limit, data.search);
  }
}
