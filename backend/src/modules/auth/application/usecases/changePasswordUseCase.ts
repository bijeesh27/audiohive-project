import { UserNotFound } from "../../../../common/Errors/Error.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { ChangePasswordDTO } from "../dtos/AuthDTO.ts";
import bcrypt from "bcrypt";

export class ChangePasswordUseCase implements IuseCase<
  ChangePasswordDTO & { email: string },
  IuserDocument
> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(
    data: ChangePasswordDTO & { email: string },
  ): Promise<IuserDocument> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UserNotFound();
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const password = {
      password: hashedPassword,
    };
    const updateUser = await this.userRepository.updateUser(user._id, password);

    return updateUser as IuserDocument;
  }
}
