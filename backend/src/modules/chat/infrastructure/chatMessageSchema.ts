import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChatMessageDocument extends Document {
  roomId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  senderRole: string;
  content: string;
  type: "text" | "system" | "file";
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessageDocument>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    type: {
      type: String,
      enum: ["text", "system", "file"],
      default: "text",
    },
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String, required: true },
        fileSize: { type: Number, required: true },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ roomId: 1, createdAt: -1 });

export const ChatMessageModel = mongoose.model<IChatMessageDocument>(
  "ChatMessage",
  chatMessageSchema
);
