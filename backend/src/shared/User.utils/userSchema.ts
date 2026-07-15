import mongoose, { Schema } from "mongoose";

export interface IuserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role?: string;
  status: boolean;
}

const userSchema = new Schema<IuserDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "member",
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<IuserDocument>("User", userSchema);
