import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDTO } from "../../../../shared/User.utils/userDTO.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { GetAllUsersQueryDTO } from "../dtos/workspaceAdminDTO.ts";

export class GetAllUserUseCase implements IuseCase<GetAllUsersQueryDTO, { users: IuserDTO[]; total: number } | null> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: GetAllUsersQueryDTO) {
    return await this.userRepository.getAllUsers(data.workspaceId, data.page, data.limit,data.search);
  }
}
