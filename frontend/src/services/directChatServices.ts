import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface ConversationParticipant {
  _id: string;
  username: string;
  email: string;
  role: string;
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  otherUser: ConversationParticipant;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
    type: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "file" | "system";
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface PaginatedDirectMessages {
  messages: DirectMessage[];
  total: number;
  hasMore: boolean;
  conversation: Conversation;
}

export interface EligibleUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
}

export const getConversations = async (): Promise<Conversation[]> => {
  const res = await axiosInstance.get(API_ENDPOINTS.DIRECT_CHAT.GET_CONVERSATIONS);
  return res.data.data;
};

export const getConversationMessages = async (
  conversationId: string,
  params?: { limit?: number; before?: string }
): Promise<PaginatedDirectMessages> => {
  const res = await axiosInstance.get(
    API_ENDPOINTS.DIRECT_CHAT.GET_MESSAGES(conversationId),
    { params }
  );
  return res.data.data;
};

export const getOrCreateWithUser = async (targetUserId: string): Promise<Conversation> => {
  const res = await axiosInstance.get(
    API_ENDPOINTS.DIRECT_CHAT.GET_OR_CREATE_WITH_USER(targetUserId)
  );
  return res.data.data;
};

export const sendDirectMessage = async (data: {
  receiverId: string;
  content: string;
  conversationId?: string;
  type?: "text" | "file" | "system";
}): Promise<DirectMessage> => {
  const res = await axiosInstance.post(API_ENDPOINTS.DIRECT_CHAT.SEND_MESSAGE, data);
  return res.data.data;
};

export const markConversationAsRead = async (
  conversationId: string
): Promise<{ count: number }> => {
  const res = await axiosInstance.patch(
    API_ENDPOINTS.DIRECT_CHAT.MARK_READ(conversationId)
  );
  return res.data.data;
};

export const searchDirectChatUsers = async (query?: string): Promise<EligibleUser[]> => {
  const res = await axiosInstance.get(API_ENDPOINTS.DIRECT_CHAT.GET_USERS, {
    params: { query },
  });
  return res.data.data;
};

export const getDirectChatUnreadCount = async (): Promise<{ unreadCount: number }> => {
  const res = await axiosInstance.get(API_ENDPOINTS.DIRECT_CHAT.UNREAD_COUNT);
  return res.data.data;
};
