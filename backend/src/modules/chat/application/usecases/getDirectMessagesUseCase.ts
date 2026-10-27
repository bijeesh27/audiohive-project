import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDirectMessageRepository } from "../../domain/IDirectMessageRepository.js";
import {
  GetDirectMessagesOptions,
  PaginatedDirectMessages,
  ConversationResponseDTO,
} from "../dto/directMessageDTO.js";
import { AccessDeniedError } from "../../../../common/Errors/AuthError.js";
import { socketService } from "../../../../socket/socketService.js";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents.js";

export class GetDirectMessagesUseCase
  implements
    IuseCase<
      {
        conversationId: string;
        userId: string;
        options?: GetDirectMessagesOptions;
      },
      PaginatedDirectMessages & { conversation: ConversationResponseDTO }
    >
{
  constructor(private readonly dmRepository: IDirectMessageRepository) {}

  async execute({
    conversationId,
    userId,
    options = {},
  }: {
    conversationId: string;
    userId: string;
    options?: GetDirectMessagesOptions;
  }): Promise<PaginatedDirectMessages & { conversation: ConversationResponseDTO }> {
    const conv = await this.dmRepository.findConversationById(conversationId);
    if (!conv) {
      throw new AccessDeniedError("Conversation not found");
    }

    const participantIds = (conv.participants || []).map((p: any) =>
      p._id?.toString() || p.toString()
    );

    if (!participantIds.includes(userId)) {
      throw new AccessDeniedError("You are not a participant in this conversation");
    }

    const { messages, total, hasMore } = await this.dmRepository.getMessages(
      conversationId,
      options
    );

    // Auto mark as read when fetching conversation
    const modified = await this.dmRepository.markMessagesAsRead(conversationId, userId);
    if (modified > 0) {
      const remainingUnread = await this.dmRepository.getTotalUnreadCount(userId);
      const io = socketService.getIO();
      io.to(`user:${userId}`).emit(SOCKET_EVENTS.DM_UNREAD_COUNT, { unreadCount: remainingUnread });
      io.to(`user:${userId}`).emit(SOCKET_EVENTS.DM_MESSAGES_READ, { conversationId, readBy: userId });

      const otherParticipantId = participantIds.find((id) => id !== userId);
      if (otherParticipantId) {
        io.to(`user:${otherParticipantId}`).emit(SOCKET_EVENTS.DM_MESSAGES_READ, {
          conversationId,
          readBy: userId,
        });
      }
    }

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

    const formattedMessages = messages.map((m) => ({
      id: m._id.toString(),
      conversationId: m.conversationId.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
      content: m.content,
      type: m.type,
      isRead: m.isRead,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      messages: formattedMessages,
      total,
      hasMore,
      conversation: {
        id: conv._id.toString(),
        participants,
        otherUser,
        unreadCount: 0,
        updatedAt: conv.updatedAt.toISOString(),
      },
    };
  }
}
