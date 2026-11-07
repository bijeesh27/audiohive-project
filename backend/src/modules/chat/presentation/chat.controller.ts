import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware.js";
import { ApiResposne } from "../../../common/Response/Response.js";
import { AppError } from "../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../common/constant/httpStatus.js";
import { MESSAGES } from "../../../common/constant/messages.js";
import { IuseCase } from "../../../shared/interface/IuseCase.js";
import {
  SendMessageInputDTO,
  ChatMessageResponseDTO,
} from "../application/dto/chatDTO.js";
import {
  GetRoomMessagesOptions,
  PaginatedChatMessages,
} from "../domain/IChatMessageRepository.js";

export class ChatController {
  constructor(
    private readonly sendMessageUseCase: IuseCase<SendMessageInputDTO, ChatMessageResponseDTO>,
    private readonly getRoomMessagesUseCase: IuseCase<
      { roomId: string; options: GetRoomMessagesOptions },
      PaginatedChatMessages
    >,
    private readonly deleteMessageUseCase: IuseCase<
      { messageId: string; userId: string; role: string },
      boolean
    >
  ) {}

  private getAuthenticatedUser(req: AuthRequest) {
    const user = req.user;
    if (!user) {
      throw new AppError(MESSAGES.ERRORS.AUTHENTICATION_REQUIRED, HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.roomId as string;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const before = (req.query.before as string) || undefined;

      const result = await this.getRoomMessagesUseCase.execute({
        roomId,
        options: { limit, before },
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MESSAGES_RETRIEVED, result);
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      if (!user.workspaceId) {
        throw new AppError(MESSAGES.ERRORS.WORKSPACE_CONTEXT_MISSING, HttpStatus.BAD_REQUEST);
      }

      const roomId = req.params.roomId as string;
      const { content, type, attachments } = req.body;

      if (!content?.trim() && (!attachments || attachments.length === 0)) {
        throw new AppError(MESSAGES.ERRORS.MESSAGE_CONTENT_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const result = await this.sendMessageUseCase.execute({
        roomId,
        workspaceId: user.workspaceId,
        senderId: user.id,
        senderName: user.username,
        senderRole: user.role,
        content: content?.trim() || "",
        type,
        attachments,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MESSAGE_SENT, result, HttpStatus.CREATED);
    } catch (err) {
      next(err);
    }
  };

  deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const messageId = req.params.messageId as string;

      await this.deleteMessageUseCase.execute({
        messageId,
        userId: user.id,
        role: user.role,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MESSAGE_DELETED, { success: true });
    } catch (err) {
      next(err);
    }
  };
}
