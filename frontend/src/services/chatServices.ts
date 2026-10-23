import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface ChatMessage {
  _id?: string;
  id?: string;
  roomId: string;
  workspaceId?: string;
  senderId: string | { _id: string; username: string; email: string };
  senderName: string;
  senderRole: string;
  content: string;
  type?: "text" | "system" | "file";
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  createdAt: string;
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}

export const getRoomMessages = async (
  roomId: string,
  params?: { limit?: number; before?: string }
): Promise<GetMessagesResponse> => {
  const res = await axiosInstance.get(API_ENDPOINTS.CHAT.GET_MESSAGES(roomId), { params });
  return res.data.data;
};

export const sendRoomMessage = async (
  roomId: string,
  data: {
    content: string;
    type?: "text" | "system" | "file";
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }>;
  }
): Promise<ChatMessage> => {
  const res = await axiosInstance.post(API_ENDPOINTS.CHAT.SEND_MESSAGE(roomId), data);
  return res.data.data;
};

export const deleteRoomMessage = async (
  roomId: string,
  messageId: string
): Promise<{ success: boolean }> => {
  const res = await axiosInstance.delete(API_ENDPOINTS.CHAT.DELETE_MESSAGE(roomId, messageId));
  return res.data.data;
};
