import { IConversationDocument } from "../infrastructure/conversationSchema";
import { IDirectMessageDocument } from "../infrastructure/directMessageSchema";
import { GetDirectMessagesOptions, EligibleUserDTO } from "../application/dto/directMessageDTO";

export interface IDirectMessageRepository {
  findOrCreateConversation(
    userId1: string,
    userId2: string,
    workspaceId?: string
  ): Promise<IConversationDocument>;

  getUserConversations(userId: string): Promise<IConversationDocument[]>;

  findConversationById(conversationId: string): Promise<IConversationDocument | null>;

  createMessage(data: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type?: "text" | "file" | "system";
  }): Promise<IDirectMessageDocument>;

  getMessages(
    conversationId: string,
    options: GetDirectMessagesOptions
  ): Promise<{ messages: IDirectMessageDocument[]; total: number; hasMore: boolean }>;

  markMessagesAsRead(conversationId: string, userId: string): Promise<number>;

  getTotalUnreadCount(userId: string): Promise<number>;

  verifyUsersCanMessage(
    userId1: string,
    userId2: string,
    currentWorkspaceId?: string
  ): Promise<boolean>;

  searchEligibleUsers(
    userId: string,
    currentWorkspaceId?: string,
    query?: string
  ): Promise<EligibleUserDTO[]>;
}
