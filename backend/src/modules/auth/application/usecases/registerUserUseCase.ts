import { UserAlreadyExist } from "../../../../common/Errors/AuthError.ts";
import { generateOtp } from "../../../../shared/utils/otp.utils.ts";
import { IotpReposiroty } from "../../domain/IotpRepository.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { IuserDTO } from "../../../../shared/User.utils/userDTO.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { RegisterDTO } from "../dtos/AuthDTO.ts";
import bcrypt from "bcrypt";

export class RegiterUserUseCase implements IuseCase<RegisterDTO, void> {
  constructor(
    private readonly userRpository: IuserRepository,
    private readonly otpRepository: IotpReposiroty,
  ) {}

  async execute(data: RegisterDTO) {
    const { username, email, password } = data;
    const exist = await this.userRpository.findByEmail(email);
    if (exist) {
      throw new UserAlreadyExist();
    }
    const newOtp = generateOtp();
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser: IuserDTO = {
      username,
      email,
      password: hashedPassword
    };
    await this.otpRepository.createOtp(email, newOtp, newUser);
  }
}
