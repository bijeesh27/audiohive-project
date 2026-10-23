import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { ApiResposne } from "../../../common/Response/Response";
import { SendMessageUseCase } from "../application/usecases/sendMessageUseCase";
import { GetRoomMessagesUseCase } from "../application/usecases/getRoomMessagesUseCase";
import { DeleteMessageUseCase } from "../application/usecases/deleteMessageUseCase";

export class ChatController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getRoomMessagesUseCase: GetRoomMessagesUseCase,
    private readonly deleteMessageUseCase: DeleteMessageUseCase
  ) {}

  async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const before = (req.query.before as string) || undefined;

      const result = await this.getRoomMessagesUseCase.execute({
        roomId,
        options: { limit, before },
      });

      return ApiResposne.success(res, "Messages retrieved", result);
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const { content, type, attachments } = req.body;
      const user = req.user!;

      const result = await this.sendMessageUseCase.execute({
        roomId,
        workspaceId: user.workspaceId!,
        senderId: user.id,
        senderName: user.username,
        senderRole: user.role,
        content,
        type,
        attachments,
      });

      return ApiResposne.success(res, "Message sent", result);
    } catch (err) {
      next(err);
    }
  }

  async deleteMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const user = req.user!;

      await this.deleteMessageUseCase.execute({
        messageId,
        userId: user.id,
        role: user.role,
      });

      return ApiResposne.success(res, "Message deleted", { success: true });
    } catch (err) {
      next(err);
    }
  }
}
