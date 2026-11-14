import { IWhiteboardBroadcaster } from "../domain/IwhiteboardBroadcaster.js";
import { StickyNoteResponseDTO } from "../application/dto/whiteboardDTO.js";
import { socketService } from "../../../socket/socketService.js";
import { SOCKET_EVENTS } from "../../../socket/socketEvents.js";
import logger from "../../../shared/utils/logger.js";

export class WhiteboardSocketBroadcaster implements IWhiteboardBroadcaster {
  private emitSafely(roomId: string, event: string, payload: unknown): void {
    try {
      socketService.getIO().to(`whiteboard:${roomId}`).emit(event, payload);
    } catch (err) {
      logger.warn(`Failed to emit ${event} to whiteboard:${roomId}:`, err);
    }
  }

  broadcastNoteCreated(roomId: string, note: StickyNoteResponseDTO): void {
    this.emitSafely(roomId, SOCKET_EVENTS.WHITEBOARD_NOTE_CREATED, note);
  }

  broadcastNoteUpdated(roomId: string, note: StickyNoteResponseDTO): void {
    this.emitSafely(roomId, SOCKET_EVENTS.WHITEBOARD_NOTE_UPDATED, note);
  }

  broadcastNoteMoved(
    roomId: string,
    data: {
      noteId: string;
      positionX: number;
      positionY: number;
      updatedBy?: { userId: string; username: string };
      version: number;
    }
  ): void {
    this.emitSafely(roomId, SOCKET_EVENTS.WHITEBOARD_NOTE_MOVED, data);
  }

  broadcastNoteColorUpdated(
    roomId: string,
    data: {
      noteId: string;
      color: string;
      updatedBy?: { userId: string; username: string };
      version: number;
    }
  ): void {
    this.emitSafely(roomId, SOCKET_EVENTS.WHITEBOARD_NOTE_COLOR_UPDATED, data);
  }

  broadcastNoteDeleted(roomId: string, noteId: string): void {
    this.emitSafely(roomId, SOCKET_EVENTS.WHITEBOARD_NOTE_DELETED, { noteId });
  }
}

