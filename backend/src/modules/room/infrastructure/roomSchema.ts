import { Schema, model, Document, Types } from "mongoose";

export interface IRoomSettings {
  music?: {
    enabled: boolean;
  };
}

export interface IRoomDocument extends Document {
  organizationId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  description?: string;
  type: "standard" | "lounge" | "public" | "private";
  isDefault: boolean;
  isPrivate: boolean;
  status: "active" | "blocked";
  capacity?: number;
  settings?: IRoomSettings;
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
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    type: {
      type: String,
      enum: ["standard", "lounge", "public", "private"],
      default: "standard",
    },

    settings: {
      music: {
        enabled: {
          type: Boolean,
          default: true,
        },
      },
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

    capacity: {
      type: Number,
      default: 25,
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

roomSchema.index(
  { workspaceId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

roomSchema.index({ workspaceId: 1, isDefault: -1, createdAt: -1 });

export const RoomModel = model<IRoomDocument>("Room", roomSchema);