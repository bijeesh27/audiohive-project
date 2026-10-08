import { IotpDocument } from "../infrastructure/otpSchema.ts";
import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";

export interface IotpReposiroty {
  findOtp(email: string, otp: string): Promise<IotpDocument | null>;
  deleteOtp(email: string): Promise<void>;
  updateOtpCode(email: string, newOtp: string): Promise<IotpDocument | null>;
  createOtp(
    email: string,
    newOtp: string,
    data: IuserDTO,
  ): Promise<IotpDocument | null>;
}
