import { UserNotFound, PasswordMatchError } from "../../../../common/Errors/AuthError.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDTO } from "../../../../shared/User.utils/userDTO.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { ChangePasswordDTO } from "../dtos/AuthDTO.ts";
import bcrypt from "bcrypt";

export class ChangePasswordUseCase implements IuseCase<
  ChangePasswordDTO & { email: string },
  IuserDTO
> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(
    data: ChangePasswordDTO & { email: string },
  ): Promise<IuserDTO> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UserNotFound();
    }

    const isMatch = await bcrypt.compare(data.oldPassword, user.password);
    if (!isMatch) {
      throw new PasswordMatchError();
    }

    const hashedPassword = await bcrypt.hash(data.password!, 12);

    const password = {
      password: hashedPassword,
    };
    const updateUser = await this.userRepository.updateUser(user._id!, password);

    return updateUser as IuserDTO;
  }
}
