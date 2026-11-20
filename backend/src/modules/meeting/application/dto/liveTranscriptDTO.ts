export interface LiveTranscriptTurnDTO {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
}

export interface MeetingLiveTranscriptDTO {
  id: string;
  meetingId: string;
  workspaceId?: string;
  turns: LiveTranscriptTurnDTO[];
  createdAt: Date;
  updatedAt: Date;
}
