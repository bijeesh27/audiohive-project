import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDirectMessageRepository } from "../../domain/IDirectMessageRepository.js";
import { socketService } from "../../../../socket/socketService.js";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents.js";

export class MarkDirectMessagesAsReadUseCase
  implements IuseCase<{ conversationId: string; userId: string }, { count: number }>
{
  constructor(private readonly dmRepository: IDirectMessageRepository) {}

  async execute({
    conversationId,
    userId,
  }: {
    conversationId: string;
    userId: string;
  }): Promise<{ count: number }> {
    const conv = await this.dmRepository.findConversationById(conversationId);
    if (!conv) {
      return { count: 0 };
    }

    const modified = await this.dmRepository.markMessagesAsRead(conversationId, userId);
    const remainingUnread = await this.dmRepository.getTotalUnreadCount(userId);

    const io = socketService.getIO();
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.DM_UNREAD_COUNT, { unreadCount: remainingUnread });
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.DM_MESSAGES_READ, { conversationId, readBy: userId });

    const otherParticipantId = conv.participants
      ?.map((p: any) => p._id?.toString() || p.toString())
      .find((id) => id !== userId);

    if (otherParticipantId) {
      io.to(`user:${otherParticipantId}`).emit(SOCKET_EVENTS.DM_MESSAGES_READ, {
        conversationId,
        readBy: userId,
      });
    }

    return { count: modified };
  }
}
