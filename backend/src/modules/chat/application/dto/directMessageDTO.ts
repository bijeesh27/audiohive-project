export interface SendDirectMessageInputDTO {
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  content: string;
  workspaceId?: string;
  type?: "text" | "file" | "system";
  conversationId?: string;
}

export interface DirectMessageResponseDTO {
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

export interface ConversationParticipantDTO {
  _id: string;
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
}

export interface ConversationResponseDTO {
  id: string;
  participants: ConversationParticipantDTO[];
  otherUser: ConversationParticipantDTO;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
    type: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface GetDirectMessagesOptions {
  limit?: number;
  before?: string;
}

export interface PaginatedDirectMessages {
  messages: DirectMessageResponseDTO[];
  total: number;
  hasMore: boolean;
}

export interface EligibleUserDTO {
  _id: string;
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
}
