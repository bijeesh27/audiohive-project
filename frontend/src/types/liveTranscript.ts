export interface LiveTranscriptTurn {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
}

export interface ActiveCaption {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
}

export interface LiveTranscriptErrorPayload {
  message: string;
}
