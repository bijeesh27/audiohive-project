import { BaseRepository } from "../../../shared/common/baseRepository";
import { IChatMessageDocument, ChatMessageModel } from "./chatMessageSchema";
import {
  IChatMessageRepository,
  GetRoomMessagesOptions,
  PaginatedChatMessages,
} from "../domain/IChatMessageRepository";
import { SendMessageInputDTO } from "../application/dto/chatDTO";

export class ChatMessageRepository
  extends BaseRepository<IChatMessageDocument>
  implements IChatMessageRepository
{
  constructor() {
    super(ChatMessageModel);
  }

  async createMessage(data: SendMessageInputDTO): Promise<IChatMessageDocument> {
    return (await this.create(data as unknown as Partial<IChatMessageDocument>)) as IChatMessageDocument;
  }

  async getRoomMessages(roomId: string, options: GetRoomMessagesOptions): Promise<PaginatedChatMessages> {
    const limit = options.limit ?? 50;
    const query: Record<string, any> = {
      roomId,
      isDeleted: false,
    };

    if (options.before) {
      query.createdAt = { $lt: new Date(options.before) };
    }

    const [messages, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("senderId", "username email")
        .lean(),
      this.model.countDocuments({ roomId, isDeleted: false }),
    ]);

    return {
      messages: (messages as unknown as IChatMessageDocument[]).reverse(),
      total,
      hasMore: messages.length === limit,
    };
  }

  async findMessageById(messageId: string): Promise<IChatMessageDocument | null> {
    return this.findById(messageId);
  }

  async softDeleteMessage(messageId: string): Promise<IChatMessageDocument | null> {
    return this.model.findByIdAndUpdate(
      messageId,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }
}
