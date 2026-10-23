import mongoose, { Schema } from "mongoose";

export interface IuserDocument {
   _id?: string;
  username: string;
  email: string;
  password: string;
  role?: string;
  status?: boolean;
  workspaceIds?: Array<string | mongoose.Types.ObjectId>;
  /** @deprecated Read only during migration from the single-workspace model. */
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
    workspaceIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Workspace" }],
      default: [],
    },
    // Retained temporarily so existing Mongo documents remain readable while
    // workspaceIds is backfilled. New writes should use workspaceIds only.
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    },
  },
  { timestamps: true },
);

userSchema.index({ workspaceIds: 1, role: 1 });

export const UserModel = mongoose.model<IuserDocument>("User", userSchema);
