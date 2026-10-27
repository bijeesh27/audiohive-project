import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDirectMessageRepository } from "../../domain/IDirectMessageRepository.js";
import { SendDirectMessageInputDTO, DirectMessageResponseDTO } from "../dto/directMessageDTO.js";
import { AccessDeniedError } from "../../../../common/Errors/AuthError.js";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository.js";
import { socketService } from "../../../../socket/socketService.js";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents.js";

export class SendDirectMessageUseCase
  implements IuseCase<SendDirectMessageInputDTO, DirectMessageResponseDTO>
{
  constructor(
    private readonly dmRepository: IDirectMessageRepository,
    private readonly activityLogRepo?: IactivityLogRepository
  ) {}

  async execute(data: SendDirectMessageInputDTO): Promise<DirectMessageResponseDTO> {
    const canMessage = await this.dmRepository.verifyUsersCanMessage(
      data.senderId,
      data.receiverId,
      data.workspaceId
    );

    if (!canMessage) {
      throw new AccessDeniedError("You do not have permission to message this user");
    }

    let conversation = data.conversationId
      ? await this.dmRepository.findConversationById(data.conversationId)
      : null;

    if (!conversation) {
      conversation = await this.dmRepository.findOrCreateConversation(
        data.senderId,
        data.receiverId,
        data.workspaceId
      );
    }

    const saved = await this.dmRepository.createMessage({
      conversationId: conversation._id.toString(),
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      type: data.type || "text",
    });

    const messagePayload: DirectMessageResponseDTO = {
      id: saved._id.toString(),
      conversationId: saved.conversationId.toString(),
      senderId: saved.senderId.toString(),
      receiverId: saved.receiverId.toString(),
      content: saved.content,
      type: saved.type,
      isRead: saved.isRead,
      readAt: saved.readAt ? saved.readAt.toISOString() : null,
      createdAt: saved.createdAt.toISOString(),
    };

    const io = socketService.getIO();
    io.to(`user:${data.receiverId}`).emit(SOCKET_EVENTS.DM_NEW_MESSAGE, messagePayload);
    io.to(`user:${data.senderId}`).emit(SOCKET_EVENTS.DM_NEW_MESSAGE, messagePayload);

    const receiverUnread = await this.dmRepository.getTotalUnreadCount(data.receiverId);
    io.to(`user:${data.receiverId}`).emit(SOCKET_EVENTS.DM_UNREAD_COUNT, {
      unreadCount: receiverUnread,
    });

    if (this.activityLogRepo) {
      await this.activityLogRepo.recordActivity({
        occurredAt: new Date(),
        action: "CHAT_MESSAGE_SENT",
        actorId: data.senderId,
        actorRole: data.senderRole,
        workspaceId: data.workspaceId,
        targetType: "DirectChat",
        targetId: data.receiverId,
        metadata: {
          conversationId: conversation._id.toString(),
          messageType: data.type || "text",
        },
      });
    }

    return messagePayload;
  }
}
