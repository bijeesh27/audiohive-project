import { Schema, model, Document, Types } from "mongoose";

export interface IRoomDocument extends Document {
  organizationId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  description?: string;
  type: "public" | "private";
  isPrivate: boolean;
  status: "active" | "blocked";
  allowedUsers: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoomDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      unique:true
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: ["public", "private"],
      required: true,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },

    allowedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const RoomModel = model<IRoomDocument>("Room", roomSchema);