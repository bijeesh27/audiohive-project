import { MESSAGES } from "../../../../common/constant/messages.ts";
import { UserNotFound } from "../../../../common/Errors/AuthError.ts";
import { emailQueue } from "../../../../config/queue.config.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { generateOtp } from "../../../../shared/utils/otp.utils.ts";
import { IotpReposiroty } from "../../domain/IotpRepository.ts";

export class ResendOtpUseCase implements IuseCase<{ email: string }, void> {
  constructor(private readonly otpRepository: IotpReposiroty) {}

  async execute(data: { email: string }) {
    const { email } = data;
    const newOtp = generateOtp();
    const updated = await this.otpRepository.updateOtpCode(email, newOtp);
    await emailQueue.add("send-otp",{
          to:email,
          otp:newOtp
        })
    
    if (!updated) {
      throw new UserNotFound(MESSAGES.ERRORS.SESSION_EXPIRED);
    }
  }
}
