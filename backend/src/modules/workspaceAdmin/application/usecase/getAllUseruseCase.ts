import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { GetAllUsersQueryDTO, GetAllUsersResponseDTO } from "../dtos/workspaceAdminDTO.ts";

export class GetAllUserUseCase implements IuseCase<GetAllUsersQueryDTO, GetAllUsersResponseDTO | null> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: GetAllUsersQueryDTO) {
    return await this.userRepository.getAllUsers(data);
  }
}
