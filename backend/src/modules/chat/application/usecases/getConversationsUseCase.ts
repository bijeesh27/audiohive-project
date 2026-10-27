import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDirectMessageRepository } from "../../domain/IDirectMessageRepository.js";
import { ConversationResponseDTO } from "../dto/directMessageDTO.js";
import { socketService } from "../../../../socket/socketService.js";

export class GetConversationsUseCase
  implements IuseCase<{ userId: string }, ConversationResponseDTO[]>
{
  constructor(private readonly dmRepository: IDirectMessageRepository) {}

  async execute({ userId }: { userId: string }): Promise<ConversationResponseDTO[]> {
    const rawConversations = await this.dmRepository.getUserConversations(userId);

    const conversations: ConversationResponseDTO[] = rawConversations
      .map((conv) => {
        const participants = (conv.participants || []).map((p: any) => ({
          _id: p._id?.toString() || p.toString(),
          username: p.username || "Unknown",
          email: p.email || "",
          role: p.role || "member",
          isOnline: socketService.isUserOnline(p._id?.toString() || p.toString()),
        }));

        const otherUser =
          participants.find((p) => p._id !== userId) ||
          participants[0] || {
            _id: "",
            username: "Unknown User",
            email: "",
            role: "member",
            isOnline: false,
          };

        const unreadCount = conv.unreadCounts?.get(userId) || 0;

        return {
          id: conv._id.toString(),
          participants,
          otherUser,
          lastMessage: conv.lastMessage
            ? {
                content: conv.lastMessage.content || "",
                senderId: conv.lastMessage.senderId?.toString() || "",
                createdAt: conv.lastMessage.createdAt
                  ? new Date(conv.lastMessage.createdAt).toISOString()
                  : new Date().toISOString(),
                type: conv.lastMessage.type || "text",
              }
            : undefined,
          unreadCount,
          updatedAt: conv.updatedAt
            ? new Date(conv.updatedAt).toISOString()
            : new Date().toISOString(),
        };
      })
      .filter((c) => Boolean(c.otherUser?._id));

    return conversations;
  }
}
