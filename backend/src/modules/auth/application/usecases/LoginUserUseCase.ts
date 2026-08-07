import {
  PasswordMatchError,
  UserNotFound,
  AccountDisabledError,
} from "../../../../common/Errors/AuthError.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";
import bcrypt from "bcrypt";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { LoginDTO } from "../dtos/AuthDTO.ts";

export class LoginUserUseCase implements IuseCase<LoginDTO, IuserDocument> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: IuserDocument) {
    const { email, password } = data;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFound();
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new PasswordMatchError();
    }

    if (!user.status) {
      throw new AccountDisabledError();
    }

    return user;
  }
}
