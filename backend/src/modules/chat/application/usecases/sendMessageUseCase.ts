import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IChatMessageRepository } from "../../domain/IChatMessageRepository";
import { SendMessageInputDTO, ChatMessageResponseDTO } from "../dto/chatDTO";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { socketService } from "../../../../socket/socketService";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents";

export class SendMessageUseCase implements IuseCase<SendMessageInputDTO, ChatMessageResponseDTO> {
  constructor(
    private readonly chatRepo: IChatMessageRepository,
    private readonly activityLogRepo?: IactivityLogRepository
  ) {}

  async execute(data: SendMessageInputDTO): Promise<ChatMessageResponseDTO> {
    const saved = await this.chatRepo.createMessage(data);

    const messagePayload: ChatMessageResponseDTO = {
      id: saved._id.toString(),
      roomId: saved.roomId.toString(),
      workspaceId: saved.workspaceId.toString(),
      senderId: saved.senderId.toString(),
      senderName: saved.senderName,
      senderRole: saved.senderRole,
      content: saved.content,
      type: saved.type,
      attachments: saved.attachments,
      createdAt: saved.createdAt.toISOString(),
    };

    socketService.getIO().to(`room:${data.roomId}`).emit(SOCKET_EVENTS.CHAT_NEW_MESSAGE, messagePayload);

    if (this.activityLogRepo) {
      await this.activityLogRepo.recordActivity({
        occurredAt: new Date(),
        action: "CHAT_MESSAGE_SENT",
        actorId: data.senderId,
        actorRole: data.senderRole,
        workspaceId: data.workspaceId,
        targetType: "RoomChat",
        targetId: data.roomId,
        metadata: { messageType: data.type || "text" },
      });
    }

    return messagePayload;
  }
}
