import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware.js";
import { ApiResposne } from "../../../common/Response/Response.js";
import { GetConversationsUseCase } from "../application/usecases/getConversationsUseCase.js";
import { GetDirectMessagesUseCase } from "../application/usecases/getDirectMessagesUseCase.js";
import { SendDirectMessageUseCase } from "../application/usecases/sendDirectMessageUseCase.js";
import { MarkDirectMessagesAsReadUseCase } from "../application/usecases/markDirectMessagesAsReadUseCase.js";
import { SearchDirectChatUsersUseCase } from "../application/usecases/searchDirectChatUsersUseCase.js";
import { GetDirectChatUnreadCountUseCase } from "../application/usecases/getDirectChatUnreadCountUseCase.js";
import { GetOrCreateConversationWithUserUseCase } from "../application/usecases/getOrCreateConversationWithUserUseCase.js";

export class DirectMessageController {
  constructor(
    private readonly getConversationsUseCase: GetConversationsUseCase,
    private readonly getDirectMessagesUseCase: GetDirectMessagesUseCase,
    private readonly sendDirectMessageUseCase: SendDirectMessageUseCase,
    private readonly markDirectMessagesAsReadUseCase: MarkDirectMessagesAsReadUseCase,
    private readonly searchDirectChatUsersUseCase: SearchDirectChatUsersUseCase,
    private readonly getDirectChatUnreadCountUseCase: GetDirectChatUnreadCountUseCase,
    private readonly getOrCreateConversationWithUserUseCase: GetOrCreateConversationWithUserUseCase
  ) {}

  async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const conversations = await this.getConversationsUseCase.execute({
        userId: user.id,
      });
      return ApiResposne.success(res, "Conversations retrieved", conversations);
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const before = (req.query.before as string) || undefined;

      const result = await this.getDirectMessagesUseCase.execute({
        conversationId,
        userId: user.id,
        options: { limit, before },
      });

      return ApiResposne.success(res, "Messages retrieved", result);
    } catch (err) {
      next(err);
    }
  }

  async getOrCreateWithUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { targetUserId } = req.params;

      const conversation = await this.getOrCreateConversationWithUserUseCase.execute({
        userId: user.id,
        targetUserId,
        workspaceId: user.workspaceId,
      });

      return ApiResposne.success(res, "Conversation ready", conversation);
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { receiverId, content, type, conversationId } = req.body;

      if (!receiverId || !content?.trim()) {
        return res.status(400).json({ success: false, message: "receiverId and content are required" });
      }

      const result = await this.sendDirectMessageUseCase.execute({
        senderId: user.id,
        senderName: user.username,
        senderRole: user.role,
        receiverId,
        content: content.trim(),
        workspaceId: user.workspaceId,
        type: type || "text",
        conversationId,
      });

      return ApiResposne.success(res, "Direct message sent", result);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { conversationId } = req.params;

      const result = await this.markDirectMessagesAsReadUseCase.execute({
        conversationId,
        userId: user.id,
      });

      return ApiResposne.success(res, "Messages marked as read", result);
    } catch (err) {
      next(err);
    }
  }

  async searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const query = (req.query.query as string) || "";

      const users = await this.searchDirectChatUsersUseCase.execute({
        userId: user.id,
        workspaceId: user.workspaceId,
        query,
      });

      return ApiResposne.success(res, "Eligible users retrieved", users);
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await this.getDirectChatUnreadCountUseCase.execute({
        userId: user.id,
      });

      return ApiResposne.success(res, "Unread count retrieved", result);
    } catch (err) {
      next(err);
    }
  }
}
