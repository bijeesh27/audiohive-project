import mongoose, { Schema } from "mongoose";

export interface IuserDocument {
   _id?: string;
  username: string;
  email: string;
  password: string;
  role?: string;
  status?: boolean;
  workspaceId?: string | mongoose.Types.ObjectId;
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
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<IuserDocument>("User", userSchema);
