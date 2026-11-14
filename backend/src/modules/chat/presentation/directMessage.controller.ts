import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware.js";
import { ApiResposne } from "../../../common/Response/Response.js";
import { AppError } from "../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../common/constant/httpStatus.js";
import { MESSAGES } from "../../../common/constant/messages.js";
import { IuseCase } from "../../../shared/interface/IuseCase.js";
import {
  SendDirectMessageInputDTO,
  DirectMessageResponseDTO,
  ConversationResponseDTO,
  GetDirectMessagesOptions,
  PaginatedDirectMessages,
  EligibleUserDTO,
} from "../application/dto/directMessageDTO.js";

export class DirectMessageController {
  constructor(
    private readonly getConversationsUseCase: IuseCase<
      { userId: string },
      ConversationResponseDTO[]
    >,
    private readonly getDirectMessagesUseCase: IuseCase<
      {
        conversationId: string;
        userId: string;
        options?: GetDirectMessagesOptions;
      },
      PaginatedDirectMessages & { conversation: ConversationResponseDTO }
    >,
    private readonly sendDirectMessageUseCase: IuseCase<
      SendDirectMessageInputDTO,
      DirectMessageResponseDTO
    >,
    private readonly markDirectMessagesAsReadUseCase: IuseCase<
      { conversationId: string; userId: string },
      { count: number }
    >,
    private readonly searchDirectChatUsersUseCase: IuseCase<
      { userId: string; workspaceId?: string; query?: string },
      EligibleUserDTO[]
    >,
    private readonly getDirectChatUnreadCountUseCase: IuseCase<
      { userId: string },
      { unreadCount: number }
    >,
    private readonly getOrCreateConversationWithUserUseCase: IuseCase<
      { userId: string; targetUserId: string; workspaceId?: string },
      ConversationResponseDTO
    >
  ) {}

  private getAuthenticatedUser(req: AuthRequest) {
    const user = req.user;
    if (!user) {
      throw new AppError(MESSAGES.ERRORS.AUTHENTICATION_REQUIRED, HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  getConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const conversations = await this.getConversationsUseCase.execute({
        userId: user.id,
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.CONVERSATIONS_RETRIEVED, conversations);
    } catch (err) {
      next(err);
    }
  };

  getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const conversationId = req.params.conversationId as string;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const before = (req.query.before as string) || (req.query.cursor as string) || undefined;

      const result = await this.getDirectMessagesUseCase.execute({
        conversationId,
        userId: user.id,
        options: { limit, before },
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MESSAGES_RETRIEVED, result);
    } catch (err) {
      next(err);
    }
  };

  getOrCreateWithUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const targetUserId = req.params.targetUserId as string;

      const conversation = await this.getOrCreateConversationWithUserUseCase.execute({
        userId: user.id,
        targetUserId,
        workspaceId: user.workspaceId,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.CONVERSATION_READY, conversation);
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const { receiverId, content, type, conversationId } = req.body;

      if (!receiverId || !content?.trim()) {
        throw new AppError(MESSAGES.ERRORS.RECEIVER_AND_CONTENT_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      if (receiverId === user.id) {
        throw new AppError("You cannot send a message to yourself", HttpStatus.BAD_REQUEST);
      }

      if (content.trim().length > 2000) {
        throw new AppError("Message content cannot exceed 2000 characters", HttpStatus.BAD_REQUEST);
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

      return ApiResposne.success(res, MESSAGES.SUCCESS.DIRECT_MESSAGE_SENT, result, HttpStatus.CREATED);
    } catch (err) {
      next(err);
    }
  };

  markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const conversationId = req.params.conversationId as string;

      const result = await this.markDirectMessagesAsReadUseCase.execute({
        conversationId,
        userId: user.id,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MESSAGES_MARKED_AS_READ, result);
    } catch (err) {
      next(err);
    }
  };

  searchUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const query = (req.query.query as string) || "";

      const users = await this.searchDirectChatUsersUseCase.execute({
        userId: user.id,
        workspaceId: user.workspaceId,
        query,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.ELIGIBLE_USERS_RETRIEVED, users);
    } catch (err) {
      next(err);
    }
  };

  getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const result = await this.getDirectChatUnreadCountUseCase.execute({
        userId: user.id,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.UNREAD_COUNT_RETRIEVED, result);
    } catch (err) {
      next(err);
    }
  };
}
