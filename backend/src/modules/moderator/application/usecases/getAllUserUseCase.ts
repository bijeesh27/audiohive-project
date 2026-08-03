import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";

export class GetAllUserUseCase implements IuseCase<{ page: number; limit: number }, { users: IuserDocument[]; total: number } | null> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: { page: number; limit: number }) {
    return await this.userRepository.getAllUsers(data.page, data.limit);
  }
}
