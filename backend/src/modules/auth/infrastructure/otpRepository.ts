import { IotpReposiroty } from "../domain/IotpRepository.ts";
import { IotpDocument, OtpModel } from "./otpSchema.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export class OtpRepository implements IotpReposiroty {
  async findOtp(email: string, otp: string): Promise<IotpDocument | null> {
    const storedOtp = await OtpModel.findOne({ userEmail: email, otp });
    return storedOtp;
  }
  
  async deleteOtp(email: string): Promise<void> {
    await OtpModel.deleteOne({ userEmail: email });
  }

  async updateOtpCode(email: string, newOtp: string): Promise<IotpDocument | null> {
    return await OtpModel.findOneAndUpdate(
      { userEmail: email },
      { otp: newOtp, createdAt: new Date() },
      { new: true }
    );
  }

  async createOtp(
    email: string,
    newOtp: string,
    data: IuserDocument,
  ): Promise<IotpDocument | null> {
    const otp = await OtpModel.create({
      userEmail: email,
      otp: newOtp,
      userData: data,
    });
    return otp;
  }
}
