import { UserNotFound } from "../../../../common/Errors/Error.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";
import { generateOtp } from "../../../../shared/utils/otp.utils.ts";
import { IotpReposiroty } from "../../domain/IotpRepository.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { ForgetPasswordDTO } from "../dtos/AuthDTO.ts";

export class ForgetUseCase implements IuseCase<
  ForgetPasswordDTO,
  IuserDocument
> {
  constructor(
    private readonly userRepository: IuserRepository,
    private readonly otpRepository: IotpReposiroty,
  ) {}

  async execute(data: ForgetPasswordDTO) {
    const { email } = data;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFound();
    }

    let newOtp = generateOtp();
    console.log(newOtp);

    await this.otpRepository.createOtp(email, newOtp, user);
    return user;
  }
}
