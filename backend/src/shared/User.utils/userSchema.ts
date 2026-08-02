import mongoose, { Schema, Types } from "mongoose";

export interface IuserDocument extends Document {
   _id?: string;
  username: string;
  email: string;
  password: string;
  role?: string;
  status?: boolean;
}

const userSchema = new Schema<IuserDocument>(
  {
    username: {
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
