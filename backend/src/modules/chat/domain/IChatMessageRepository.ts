import { IChatMessageDocument } from "../infrastructure/chatMessageSchema";
import { SendMessageInputDTO } from "../application/dto/chatDTO";

export interface GetRoomMessagesOptions {
  page?: number;
  limit?: number;
  before?: string;
}

export interface PaginatedChatMessages {
  messages: IChatMessageDocument[];
  total: number;
  hasMore: boolean;
}

export interface IChatMessageRepository {
  createMessage(data: SendMessageInputDTO): Promise<IChatMessageDocument>;
  getRoomMessages(roomId: string, options: GetRoomMessagesOptions): Promise<PaginatedChatMessages>;
  findMessageById(messageId: string): Promise<IChatMessageDocument | null>;
  softDeleteMessage(messageId: string): Promise<IChatMessageDocument | null>;
}
