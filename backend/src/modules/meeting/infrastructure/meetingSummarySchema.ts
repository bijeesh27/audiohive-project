import mongoose, { Document, Schema } from "mongoose";

export interface IMeetingSummaryActionItemDocument {
  task: string;
  assignee?: string;
  completed: boolean;
  dueDate?: string;
}

export interface IMeetingSummaryDocument extends Document {
  _id: mongoose.Types.ObjectId;
  meetingId: string;
  workspaceId?: mongoose.Types.ObjectId;
  title: string;
  overview: string;
  keyPoints: string[];
  actionItems: IMeetingSummaryActionItemDocument[];
  decisions: string[];
  sentiment: string;
  keywords: string[];
  speakers: string[];
  durationMinutes: number;
  totalTurns: number;
  generatedBy?: mongoose.Types.ObjectId;
  modelUsed: string;
  transcriptSnippet: string;
  customNotes?: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const actionItemSchema = new Schema<IMeetingSummaryActionItemDocument>(
  {
    task: { type: String, required: true },
    assignee: { type: String },
    completed: { type: Boolean, default: false },
    dueDate: { type: String },
  },
  { _id: false }
);

const meetingSummarySchema = new Schema<IMeetingSummaryDocument>(
  {
    meetingId: { type: String, required: true, unique: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", index: true },
    title: { type: String, required: true, trim: true },
    overview: { type: String, required: true },
    keyPoints: [{ type: String }],
    actionItems: [actionItemSchema],
    decisions: [{ type: String }],
    sentiment: { type: String, default: "Neutral" },
    keywords: [{ type: String }],
    speakers: [{ type: String }],
    durationMinutes: { type: Number, default: 0 },
    totalTurns: { type: Number, default: 0 },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    modelUsed: { type: String, required: true },
    transcriptSnippet: { type: String, default: "" },
    customNotes: { type: String, default: "" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MeetingSummaryModel = mongoose.model<IMeetingSummaryDocument>(
  "MeetingSummary",
  meetingSummarySchema
);
