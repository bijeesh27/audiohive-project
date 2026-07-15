import {
  PasswordMatchError,
  UserNotFound,
} from "../../../../common/Errors/Error.ts";
import { UserRpository } from "../../infrastructure/userRepository.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";
import bcrypt from "bcrypt";

export class LoginUserUseCase {
  constructor(private readonly userRepository: UserRpository) {}

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

    return user;
  }
}
