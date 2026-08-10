import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWorkspaceDocument extends Document {
  companyName: string;
  workspaceAdminName: string;
  workspaceAdminEmail: string;
  planId: Types.ObjectId;
  status: string;
  workspaceSlug: string;
  paymentStatus: string;
  amountPaid: number;
}

const workspaceSchema = new Schema<IWorkspaceDocument>(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    workspaceAdminName: {
      type: String,
      required: true,
      trim: true,
    },

    workspaceAdminEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    planId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["pending", "active", "suspended",'reject'],
      default: "pending",
    },

    workspaceSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const WorkspaceModel = mongoose.model<IWorkspaceDocument>(
  "Workspace",
  workspaceSchema,
);