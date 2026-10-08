import { UserNotFound } from "../../../../common/Errors/AuthError.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDTO } from "../../../../shared/User.utils/userDTO.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import bcrypt from "bcrypt";
import { ResetPasswordDTO } from "../dtos/AuthDTO.ts";

export class ResetPasswordUseCase implements IuseCase<ResetPasswordDTO, IuserDTO> {
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: ResetPasswordDTO): Promise<IuserDTO> {
    const { email, password } = data;
    
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFound();
    }

    const hashedPassword = await bcrypt.hash(password!, 12);
    
    const updatedUser = await this.userRepository.updateUser(user._id!, {
      password: hashedPassword,
    });

    return updatedUser as IuserDTO;
  }
}
