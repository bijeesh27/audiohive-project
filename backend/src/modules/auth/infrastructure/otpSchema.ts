import mongoose, { Schema } from "mongoose";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export interface IotpDocument extends Document {
  userEmail: string;
  otp: string;
  userData: IuserDocument;
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
