import { LiveTranscriptTurnDTO, MeetingLiveTranscriptDTO } from "../application/dto/liveTranscriptDTO.js";

export interface ILiveTranscriptRepository {
  addTurn(
    meetingId: string,
    workspaceId: string | undefined,
    turn: LiveTranscriptTurnDTO
  ): Promise<void>;

  getTranscriptByMeetingId(meetingId: string): Promise<MeetingLiveTranscriptDTO | null>;

  clearTranscript(meetingId: string): Promise<void>;
}
