import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IChatMessageRepository } from "../../domain/IChatMessageRepository";
import { socketService } from "../../../../socket/socketService";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents";

export class DeleteMessageUseCase
  implements IuseCase<{ messageId: string; userId: string; role: string }, boolean>
{
  constructor(private readonly chatRepo: IChatMessageRepository) {}

  async execute({
    messageId,
    userId,
    role,
  }: {
    messageId: string;
    userId: string;
    role: string;
  }): Promise<boolean> {
    const message = await this.chatRepo.findMessageById(messageId);
    if (!message) return false;

    const canDelete =
      message.senderId.toString() === userId ||
      role === "workspaceadmin" ||
      role === "superadmin";

    if (!canDelete) {
      throw new Error("Permission denied to delete message");
    }

    const deleted = await this.chatRepo.softDeleteMessage(messageId);
    if (deleted) {
      socketService.getIO().to(`room:${message.roomId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE_DELETED, {
        messageId,
        roomId: message.roomId.toString(),
      });
      return true;
    }
    return false;
  }
}
