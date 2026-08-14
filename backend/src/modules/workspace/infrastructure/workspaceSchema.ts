
import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWorkspaceDocument extends Document {
  organizationId: Types.ObjectId;
  workspaceName: string;
  slug: string;
  adminId: Types.ObjectId;
  status: "active" | "suspended" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspaceDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    workspaceName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 63,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },

    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "archived"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true }
);

// workspaceSchema.index({ slug: 1 }, { unique: true });
// workspaceSchema.index({ organizationId: 1 });
// workspaceSchema.index({ status: 1 });

export const WorkspaceModel = mongoose.model<IWorkspaceDocument>(
  "Workspace",
  workspaceSchema
);