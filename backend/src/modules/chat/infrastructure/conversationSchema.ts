import mongoose, { Schema, Document, Types } from "mongoose";

export interface IConversationDocument extends Document {
  participants: Types.ObjectId[];
  workspaceId?: Types.ObjectId;
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    createdAt: Date;
    type: "text" | "file" | "system";
  };
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversationDocument>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: false,
    },
    lastMessage: {
      content: { type: String, default: "" },
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
      type: { type: String, default: "text" },
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

export const ConversationModel = mongoose.model<IConversationDocument>(
  "Conversation",
  conversationSchema
);
