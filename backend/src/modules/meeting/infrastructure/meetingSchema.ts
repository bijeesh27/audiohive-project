import mongoose, { Document, Schema } from "mongoose";

export interface IMeetingDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  workspaceId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "live" | "completed" | "cancelled";
  meetingCode: string;
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeetingDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    meetingCode: { type: String, required: true, unique: true, index: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const MeetingModel = mongoose.model<IMeetingDocument>(
  "Meeting",
  meetingSchema
);
