import { IuserRepository } from "../../domain/IuserRepository.ts";

export class GetAllUserUseCase {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute() {
    return await this.userRepository.getAllUsers();
  }
}
