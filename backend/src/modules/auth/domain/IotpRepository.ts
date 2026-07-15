import { IotpDocument } from "../infrastructure/otpSchema.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export interface IotpReposiroty {
  findOtp(otp: string): Promise<IotpDocument | null>;
  createOtp(
    email: string,
    newOtp: string,
    data: IuserDocument,
  ): Promise<IotpDocument | null>;
}
