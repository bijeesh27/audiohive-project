import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware.js";
import { ApiResposne } from "../../../common/Response/Response.js";
import { AppError } from "../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../common/constant/httpStatus.js";
import { MESSAGES } from "../../../common/constant/messages.js";
import { IuseCase } from "../../../shared/interface/IuseCase.js";
import {
  GetWhiteboardNotesDTO,
  CreateStickyNoteDTO,
  UpdateStickyNoteDTO,
  MoveStickyNoteDTO,
  UpdateStickyNoteColorDTO,
  DeleteStickyNoteDTO,
  StickyNoteResponseDTO,
} from "../application/dto/whiteboardDTO.js";
import { IWhiteboardBroadcaster } from "../domain/IwhiteboardBroadcaster.js";

export class WhiteboardController {
  constructor(
    private readonly getWhiteboardNotesUseCase: IuseCase<
      GetWhiteboardNotesDTO,
      StickyNoteResponseDTO[]
    >,
    private readonly createStickyNoteUseCase: IuseCase<
      CreateStickyNoteDTO,
      StickyNoteResponseDTO
    >,
    private readonly updateStickyNoteUseCase: IuseCase<
      UpdateStickyNoteDTO,
      StickyNoteResponseDTO
    >,
    private readonly moveStickyNoteUseCase: IuseCase<
      MoveStickyNoteDTO,
      StickyNoteResponseDTO
    >,
    private readonly updateStickyNoteColorUseCase: IuseCase<
      UpdateStickyNoteColorDTO,
      StickyNoteResponseDTO
    >,
    private readonly deleteStickyNoteUseCase: IuseCase<
      DeleteStickyNoteDTO,
      boolean
    >,
    private readonly broadcaster?: IWhiteboardBroadcaster
  ) {}

  private getAuthenticatedUser(req: AuthRequest) {
    const user = req.user;
    if (!user) {
      throw new AppError(
        MESSAGES.ERRORS.AUTHENTICATION_REQUIRED,
        HttpStatus.UNAUTHORIZED
      );
    }
    return user;
  }

  getNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const roomId = req.params.roomId as string;

      if (!roomId) {
        throw new AppError(MESSAGES.ERRORS.ROOM_NOT_FOUND, HttpStatus.BAD_REQUEST);
      }

      const notes = await this.getWhiteboardNotesUseCase.execute({
        roomId,
        workspaceId: user.workspaceId,
        userId: user.id,
        role: user.role,
      });

      return ApiResposne.success(res, "Whiteboard notes retrieved successfully", notes);
    } catch (err) {
      next(err);
    }
  };

  createNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const roomId = req.params.roomId as string;

      if (!roomId) {
        throw new AppError(MESSAGES.ERRORS.ROOM_NOT_FOUND, HttpStatus.BAD_REQUEST);
      }

      const { content, positionX, positionY, color } = req.body;

      const note = await this.createStickyNoteUseCase.execute({
        roomId,
        workspaceId: user.workspaceId || "",
        content: content || "",
        positionX: typeof positionX === "number" ? positionX : undefined,
        positionY: typeof positionY === "number" ? positionY : undefined,
        color: typeof color === "string" ? color : undefined,
        userId: user.id,
        username: user.username,
        userEmail: user.userEmail,
        role: user.role,
      });

      this.broadcaster?.broadcastNoteCreated(roomId, note);

      return ApiResposne.success(
        res,
        "Sticky note created successfully",
        note,
        HttpStatus.CREATED
      );
    } catch (err) {
      next(err);
    }
  };

  updateNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const roomId = req.params.roomId as string;
      const noteId = req.params.noteId as string;

      const { content, positionX, positionY, color, expectedVersion } = req.body;

      const updated = await this.updateStickyNoteUseCase.execute({
        noteId,
        roomId,
        content,
        positionX,
        positionY,
        color,
        expectedVersion,
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      this.broadcaster?.broadcastNoteUpdated(roomId, updated);

      return ApiResposne.success(res, "Sticky note updated successfully", updated);
    } catch (err) {
      next(err);
    }
  };

  moveNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const roomId = req.params.roomId as string;
      const noteId = req.params.noteId as string;
      const { positionX, positionY } = req.body;

      if (typeof positionX !== "number" || typeof positionY !== "number") {
        throw new AppError(
          "positionX and positionY must be numbers",
          HttpStatus.BAD_REQUEST
        );
      }

      const updated = await this.moveStickyNoteUseCase.execute({
        noteId,
        roomId,
        positionX,
        positionY,
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      this.broadcaster?.broadcastNoteMoved(roomId, {
        noteId: updated.id,
        positionX: updated.positionX,
        positionY: updated.positionY,
        updatedBy: updated.updatedBy,
        version: updated.version,
      });

      return ApiResposne.success(res, "Sticky note moved successfully", updated);
    } catch (err) {
      next(err);
    }
  };

  updateColor = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const roomId = req.params.roomId as string;
      const noteId = req.params.noteId as string;
      const { color } = req.body;

      if (!color || typeof color !== "string") {
        throw new AppError("color is required", HttpStatus.BAD_REQUEST);
      }

      const updated = await this.updateStickyNoteColorUseCase.execute({
        noteId,
        roomId,
        color,
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      this.broadcaster?.broadcastNoteColorUpdated(roomId, {
        noteId: updated.id,
        color: updated.color,
        updatedBy: updated.updatedBy,
        version: updated.version,
      });

      return ApiResposne.success(
        res,
        "Sticky note color updated successfully",
        updated
      );
    } catch (err) {
      next(err);
    }
  };

  deleteNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedUser(req);
      const roomId = req.params.roomId as string;
      const noteId = req.params.noteId as string;

      await this.deleteStickyNoteUseCase.execute({
        noteId,
        roomId,
        userId: user.id,
        role: user.role,
      });

      this.broadcaster?.broadcastNoteDeleted(roomId, noteId);

      return ApiResposne.success(res, "Sticky note deleted successfully", {
        noteId,
      });
    } catch (err) {
      next(err);
    }
  };
}
