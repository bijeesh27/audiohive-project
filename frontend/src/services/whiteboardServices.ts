import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface StickyNoteCreator {
  userId: string;
  username: string;
  email?: string;
}

export interface StickyNoteUpdater {
  userId: string;
  username: string;
}

export interface StickyNote {
  id: string;
  roomId: string;
  workspaceId: string;
  content: string;
  positionX: number;
  positionY: number;
  color: string;
  createdBy: StickyNoteCreator;
  updatedBy?: StickyNoteUpdater;
  version: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteboardCollaborator {
  userId: string;
  username: string;
}

export const getWhiteboardNotes = async (roomId: string): Promise<StickyNote[]> => {
  const res = await axiosInstance.get(API_ENDPOINTS.WHITEBOARD.GET_NOTES(roomId));
  return res.data.data;
};

export const createStickyNote = async (
  roomId: string,
  data: {
    content?: string;
    positionX?: number;
    positionY?: number;
    color?: string;
  }
): Promise<StickyNote> => {
  const res = await axiosInstance.post(API_ENDPOINTS.WHITEBOARD.CREATE_NOTE(roomId), data);
  return res.data.data;
};

export const updateStickyNote = async (
  roomId: string,
  noteId: string,
  data: {
    content?: string;
    positionX?: number;
    positionY?: number;
    color?: string;
    expectedVersion?: number;
  }
): Promise<StickyNote> => {
  const res = await axiosInstance.patch(
    API_ENDPOINTS.WHITEBOARD.UPDATE_NOTE(roomId, noteId),
    data
  );
  return res.data.data;
};

export const moveStickyNote = async (
  roomId: string,
  noteId: string,
  data: { positionX: number; positionY: number }
): Promise<StickyNote> => {
  const res = await axiosInstance.patch(
    API_ENDPOINTS.WHITEBOARD.MOVE_NOTE(roomId, noteId),
    data
  );
  return res.data.data;
};

export const updateStickyNoteColor = async (
  roomId: string,
  noteId: string,
  color: string
): Promise<StickyNote> => {
  const res = await axiosInstance.patch(
    API_ENDPOINTS.WHITEBOARD.UPDATE_COLOR(roomId, noteId),
    { color }
  );
  return res.data.data;
};

export const deleteStickyNote = async (
  roomId: string,
  noteId: string
): Promise<{ noteId: string }> => {
  const res = await axiosInstance.delete(
    API_ENDPOINTS.WHITEBOARD.DELETE_NOTE(roomId, noteId)
  );
  return res.data.data;
};

