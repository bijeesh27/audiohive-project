import { StickyNoteResponseDTO } from "../application/dto/whiteboardDTO.js";

export interface IWhiteboardBroadcaster {
  broadcastNoteCreated(roomId: string, note: StickyNoteResponseDTO): void;
  broadcastNoteUpdated(roomId: string, note: StickyNoteResponseDTO): void;
  broadcastNoteMoved(
    roomId: string,
    data: {
      noteId: string;
      positionX: number;
      positionY: number;
      updatedBy?: { userId: string; username: string };
      version: number;
    }
  ): void;
  broadcastNoteColorUpdated(
    roomId: string,
    data: {
      noteId: string;
      color: string;
      updatedBy?: { userId: string; username: string };
      version: number;
    }
  ): void;
  broadcastNoteDeleted(roomId: string, noteId: string): void;
}

