import mongoose, { Document, Schema } from "mongoose";

export interface ILiveTranscriptTurnDocument {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
}

export interface IMeetingLiveTranscriptDocument extends Document {
  meetingId: string;
  workspaceId?: mongoose.Types.ObjectId;
  turns: ILiveTranscriptTurnDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const liveTranscriptTurnSchema = new Schema<ILiveTranscriptTurnDocument>(
  {
    id: { type: String, required: true },
    speakerId: { type: String, required: true },
    speakerName: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  { _id: false }
);

const meetingLiveTranscriptSchema = new Schema<IMeetingLiveTranscriptDocument>(
  {
    meetingId: { type: String, required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", index: true },
    turns: [liveTranscriptTurnSchema],
  },
  { timestamps: true }
);

meetingLiveTranscriptSchema.index({ meetingId: 1, createdAt: -1 });

export const MeetingLiveTranscriptModel =
  mongoose.model<IMeetingLiveTranscriptDocument>(
    "MeetingLiveTranscript",
    meetingLiveTranscriptSchema
  );
