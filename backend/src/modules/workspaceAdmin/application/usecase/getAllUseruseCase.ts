import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts"

export class GetAllUserUseCase implements IuseCase<{ workspaceId: string; page: number; limit: number,search?: string }, { users: IuserDocument[]; total: number } | null> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: { workspaceId: string; page: number; limit: number,search?: string }) {
    return await this.userRepository.getAllUsers(data.workspaceId, data.page, data.limit,data.search);
  }
}
