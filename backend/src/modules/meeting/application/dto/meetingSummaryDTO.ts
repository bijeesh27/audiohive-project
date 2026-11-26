import mongoose from "mongoose";
import type { GeneratedActionItem } from "../../../../services/groqSummary.service.js";

export interface GenerateMeetingSummaryDTO {
  meetingId: string;
  workspaceId?: string;
  userId?: string;
  customNotes?: string;
}

export interface GetMeetingSummaryDTO {
  meetingId: string;
  workspaceId?: string;
}

export interface UpdateMeetingActionItemDTO {
  meetingId: string;
  itemIndex: number;
  completed: boolean;
}

export interface UpsertMeetingSummaryData {
  workspaceId?: mongoose.Types.ObjectId;
  title: string;
  overview: string;
  keyPoints: string[];
  actionItems: GeneratedActionItem[];
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
}
