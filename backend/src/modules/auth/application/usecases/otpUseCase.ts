import { InvalidOtpError } from "../../../../common/Errors/Error.ts";
import { IotpReposiroty } from "../../domain/IotpRepository.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { IotpDocument } from "../../infrastructure/otpSchema.ts";

export class OtpUseCase {
  constructor(
    private readonly otpRepository: IotpReposiroty,
    private readonly registrUserUseCase: IuserRepository,
  ) {}

  async execute(data: IotpDocument) {
    let { otp } = data;

    const storedOtp = await this.otpRepository.findOtp(otp);
    if (storedOtp == null) {
      throw new InvalidOtpError();
    }
    const { userData } = storedOtp;
    await this.registrUserUseCase.createUser(userData);
  }
}
