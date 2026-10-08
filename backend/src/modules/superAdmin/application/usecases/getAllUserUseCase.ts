import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { GetAllUsersDTO, GetAllUsersResultDTO } from "../dtos/SuperAdminDTO.ts";

export class GetAllUserUseCase implements IuseCase<GetAllUsersDTO, GetAllUsersResultDTO | null> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: GetAllUsersDTO) {
    return await this.userRepository.getAllUsers(data.page, data.limit,data.search);
  }
}
