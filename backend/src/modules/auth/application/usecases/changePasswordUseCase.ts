import { UserNotFound } from "../../../../common/Errors/Error.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";

export class ChangePasswordUseCase {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: any, email: any) {
    console.log(email);

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFound();
    }

    const password = {
      password: data.password,
    };
    const updateUer = await this.userRepository.updateUser(user._id, password);
  }
}
