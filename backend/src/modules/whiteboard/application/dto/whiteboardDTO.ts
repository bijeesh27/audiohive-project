import { IStickyNote } from "../../domain/whiteboard.entity.js";

export interface GetWhiteboardNotesDTO {
  roomId: string;
  workspaceId?: string;
  userId: string;
  role?: string;
}

export interface CreateStickyNoteDTO {
  roomId: string;
  workspaceId: string;
  content: string;
  positionX?: number;
  positionY?: number;
  color?: string;
  userId: string;
  username: string;
  userEmail?: string;
  role?: string;
}

export interface UpdateStickyNoteDTO {
  noteId: string;
  roomId: string;
  content?: string;
  positionX?: number;
  positionY?: number;
  color?: string;
  expectedVersion?: number;
  userId: string;
  username: string;
  role?: string;
}

export interface MoveStickyNoteDTO {
  noteId: string;
  roomId: string;
  positionX: number;
  positionY: number;
  userId: string;
  username: string;
  role?: string;
}

export interface UpdateStickyNoteColorDTO {
  noteId: string;
  roomId: string;
  color: string;
  userId: string;
  username: string;
  role?: string;
}

export interface DeleteStickyNoteDTO {
  noteId: string;
  roomId: string;
  userId: string;
  role?: string;
}

export type StickyNoteResponseDTO = IStickyNote;

