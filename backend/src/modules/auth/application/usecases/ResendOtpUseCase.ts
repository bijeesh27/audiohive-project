import { UserNotFound } from "../../../../common/Errors/Error.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { generateOtp } from "../../../../shared/utils/otp.utils.ts";
import { IotpReposiroty } from "../../domain/IotpRepository.ts";

export class ResendOtpUseCase implements IuseCase<{ email: string }, void> {
  constructor(private readonly otpRepository: IotpReposiroty) {}

  async execute(data: { email: string }) {
    const { email } = data;
    let newOtp = generateOtp();
    const updated = await this.otpRepository.updateOtpCode(email, newOtp);
    
    if (!updated) {
      throw new UserNotFound("Session expired. Please register or login again.");
    }
  }
}
