import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { UserDTO } from "../dtos/UserDTO.ts";

export class GetAllUserUseCase implements IuseCase<UserDTO,IuserDocument[]|null> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute() {
    return await this.userRepository.getAllUsers();
  }
}
