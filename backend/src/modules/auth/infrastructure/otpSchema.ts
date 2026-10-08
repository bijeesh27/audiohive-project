import mongoose, { Schema } from "mongoose";
import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";

export interface IotpDocument extends Document {
  userEmail: string;
  otp: string;
  userData: IuserDTO;
  purpose?: string;
}

const otpSchema = new Schema(
  {
    userEmail: {
      type: String,
      unique: true,
    },
    otp: {
      type: String,
      unique: true,
    },
    userData: {
      type: Object,
    },
    createdAt: {
      type: Date,
      expires: 300,
    },
  },
  { timestamps: true },
);

export const OtpModel = mongoose.model<IotpDocument>("Otp", otpSchema);
