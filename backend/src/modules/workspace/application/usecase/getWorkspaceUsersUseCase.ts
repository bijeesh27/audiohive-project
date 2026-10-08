import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDocument } from "../../../../shared/User.utils/userSchema";
import { IuserRepository } from "../../../workspaceAdmin/domain/IuserRepository";
import { GetWorkspaceUsersDTO } from "../dto/workspaceDTOs";

export class GetWorkspaceUsersUseCase implements IuseCase<GetWorkspaceUsersDTO, { users: IuserDocument[]; total: number } | null> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: GetWorkspaceUsersDTO) {
    return await this.userRepository.getAllUsers(data.workspaceId, data.page, data.limit, data.search);
  }
}
