import { IotpDocument } from "../infrastructure/otpSchema.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export interface IotpReposiroty {
  findOtp(email: string, otp: string): Promise<IotpDocument | null>;
  deleteOtp(email: string): Promise<void>;
  updateOtpCode(email: string, newOtp: string): Promise<IotpDocument | null>;
  createOtp(
    email: string,
    newOtp: string,
    data: IuserDocument,
  ): Promise<IotpDocument | null>;
}
