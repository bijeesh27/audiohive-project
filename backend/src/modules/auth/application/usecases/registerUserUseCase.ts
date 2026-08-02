import { UserAlreadyExist } from "../../../../common/Errors/Error.ts";
import { generateOtp } from "../../../../shared/utils/otp.utils.ts";
import { IotpReposiroty } from "../../domain/IotpRepository.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { RegisterDTO } from "../dtos/AuthDTO.ts";
import bcrypt from "bcrypt";

export class RegiterUserUseCase implements IuseCase<RegisterDTO, void> {
  constructor(
    private readonly userRpository: IuserRepository,
    private readonly otpRepository: IotpReposiroty,
  ) {}

  async execute(data: IuserDocument) {
    const { username, email, password } = data;
    const exist = await this.userRpository.findByEmail(email);
    if (exist) {
      throw new UserAlreadyExist();
    }
    let newOtp = generateOtp();
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser:IuserDocument = {
      username,
      email,
      password:hashedPassword
    };
    console.log(newOtp);

    await this.otpRepository.createOtp(email, newOtp, newUser);
  }
}
