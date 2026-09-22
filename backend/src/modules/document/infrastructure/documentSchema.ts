import { Schema, model, Document, Types } from "mongoose";

export interface IDocument extends Document {
  roomId: Types.ObjectId;
  uploaderId: Types.ObjectId;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    uploaderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

export const DocumentModel = model<IDocument>("Document", documentSchema);