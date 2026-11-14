import { Schema, model, Document, Types } from "mongoose";

export interface IAnnouncementDocument extends Document {
  organizationId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  roomId?: Types.ObjectId;
  title: string;
  content: string;
  type: "info" | "warning" | "critical" | "event";
  targetAudience: "all" | "room-specific";
  isPinned: boolean;
  isScheduled: boolean;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdBy: Types.ObjectId;
  readBy: Types.ObjectId[];
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncementDocument>(
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
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "critical", "event"],
      required: true,
      default: "info",
    },
    targetAudience: {
      type: String,
      enum: ["all", "room-specific"],
      required: true,
      default: "all",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for filter, sort and pagination queries
announcementSchema.index({ workspaceId: 1, status: 1, createdAt: -1 });
announcementSchema.index({ workspaceId: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ workspaceId: 1, type: 1, createdAt: -1 });
announcementSchema.index({ workspaceId: 1, readBy: 1 });
announcementSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export const AnnouncementModel = model<IAnnouncementDocument>(
  "Announcement",
  announcementSchema
);
