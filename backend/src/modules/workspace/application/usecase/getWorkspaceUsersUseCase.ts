import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDocument } from "../../../../shared/User.utils/userSchema";
import { IuserRepository } from "../../../workspaceAdmin/domain/IuserRepository";

export class GetWorkspaceUsersUseCase implements IuseCase<{ workspaceId: string; page: number; limit: number; search?: string }, { users: IuserDocument[]; total: number } | null> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: { workspaceId: string; page: number; limit: number; search?: string }) {
    return await this.userRepository.getAllUsers(data.workspaceId, data.page, data.limit, data.search);
  }
}
