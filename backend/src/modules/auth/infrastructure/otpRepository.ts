import { IotpReposiroty } from "../domain/IotpRepository.ts";
import { IotpDocument, OtpModel } from "./otpSchema.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export class OtpRepository implements IotpReposiroty {
  async findOtp(otp: string): Promise<IotpDocument | null> {
    let storedOtp = await OtpModel.findOne({ otp });
    return storedOtp;
  }
  async createOtp(
    email: string,
    newOtp: string,
    data: IuserDocument,
  ): Promise<IotpDocument | null> {
    let otp = await OtpModel.create({
      userEmail: email,
      otp: newOtp,
      userData: data,
    });
    return otp;
  }
}
