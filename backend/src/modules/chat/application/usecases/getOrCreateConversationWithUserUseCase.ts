import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDirectMessageRepository } from "../../domain/IDirectMessageRepository.js";
import { ConversationResponseDTO } from "../dto/directMessageDTO.js";
import { AccessDeniedError } from "../../../../common/Errors/AuthError.js";
import { socketService } from "../../../../socket/socketService.js";

export class GetOrCreateConversationWithUserUseCase
  implements
    IuseCase<
      { userId: string; targetUserId: string; workspaceId?: string },
      ConversationResponseDTO
    >
{
  constructor(private readonly dmRepository: IDirectMessageRepository) {}

  async execute({
    userId,
    targetUserId,
    workspaceId,
  }: {
    userId: string;
    targetUserId: string;
    workspaceId?: string;
  }): Promise<ConversationResponseDTO> {
    const canMessage = await this.dmRepository.verifyUsersCanMessage(
      userId,
      targetUserId,
      workspaceId
    );

    if (!canMessage) {
      throw new AccessDeniedError("You do not have permission to message this user");
    }

    const conv = await this.dmRepository.findOrCreateConversation(
      userId,
      targetUserId,
      workspaceId
    );

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
      unreadCount: conv.unreadCounts?.get(userId) || 0,
      updatedAt: conv.updatedAt
        ? new Date(conv.updatedAt).toISOString()
        : new Date().toISOString(),
    };
  }
}
