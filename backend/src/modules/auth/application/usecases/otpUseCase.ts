import { InvalidOtpError } from "../../../../common/Errors/Error.ts";
import { IotpReposiroty } from "../../domain/IotpRepository.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { IotpDocument } from "../../infrastructure/otpSchema.ts";

export class OtpUseCase {
  constructor(
    private readonly otpRepository: IotpReposiroty,
    private readonly userRepository: IuserRepository,
  ) {}

  async execute(data: any) {
    console.log(data)
    let { otp,purpose } = data;
   
    const storedOtp = await this.otpRepository.findOtp(otp);
    if (storedOtp == null) {
      throw new InvalidOtpError();
    }
    const { userData } = storedOtp;
     if(purpose=='register'){
      await this.userRepository.createUser(userData);
    }
    if(purpose=='forget'){
      return userData
    }
  }
}
