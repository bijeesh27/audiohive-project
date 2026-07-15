import { UserAlreadyExist } from "../../../../common/Errors/Error.ts";
import { generateOtp } from "../../../../shared/utils/otp.utils.ts";
import { IotpReposiroty } from "../../domain/IotpRepository.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";

export class RegiterUserUseCase {
  constructor(
    private readonly userRpository: IuserRepository,
    private readonly otpRepository: IotpReposiroty,
  ) {}

  async execute(data: IuserDocument) {
    const { email } = data;
    const exist = await this.userRpository.findByEmail(email);
    if (exist) {
      throw new UserAlreadyExist();
    }
    let newOtp = generateOtp();
    console.log(typeof newOtp);
    console.log(newOtp);

    await this.otpRepository.createOtp(email, newOtp, data);
  }
}
