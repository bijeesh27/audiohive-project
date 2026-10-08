import { InvalidOtpError } from "../../../../common/Errors/AuthError.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDTO } from "../../../../shared/User.utils/userDTO.ts";
import { IotpReposiroty } from "../../domain/IotpRepository.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { OtpDTO } from "../dtos/AuthDTO.ts";

export class OtpUseCase implements IuseCase<OtpDTO, IuserDTO | void> {
  constructor(
    private readonly otpRepository: IotpReposiroty,
    private readonly userRepository: IuserRepository,
  ) {}

  async execute(data: OtpDTO): Promise<IuserDTO | void> {
    const { email, otp, purpose } = data;
    

    const storedOtp = await this.otpRepository.findOtp(email, otp);
    if (storedOtp == null) {
      throw new InvalidOtpError();
    }
    const { userData } = storedOtp;
    await this.otpRepository.deleteOtp(email);

    if (purpose == "register") {
      await this.userRepository.createUser(userData);
    }
    if (purpose == "forget") {
      return userData;
    }
  }
}
