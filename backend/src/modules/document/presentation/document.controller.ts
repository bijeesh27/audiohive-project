import { Response, NextFunction } from "express";
import { IuseCase } from "../../../shared/interface/IuseCase.js";
import { UploadDocumentDTO, DeleteDocumentDTO, GetRoomDocumentsDTO } from "../application/dto/documentDTO.js";
import { IDocument } from "../infrastructure/documentSchema.js";
import logger from "../../../shared/utils/logger.js";
import { AuthRequest } from "../../../middleware/authMiddleware.js";
import { ApiResposne } from "../../../common/Response/Response.js";
import { MESSAGES } from "../../../common/constant/messages.js";
import { HttpStatus } from "../../../common/constant/httpStatus.js";
import { AppError } from "../../../common/Errors/AppError.js";
import { ResolveWorkspaceDTO, ResolvedWorkspaceDTO } from "../../workspace/application/dto/workspaceDTOs.js";
import { GetRoomDTO } from "../../room/application/dto/roomDTO.js";
import { IRoomDocument } from "../../room/infrastructure/roomSchema.js";
import { UserRoles } from "../../../common/constant/userRoles.js";
import { IDocumentRepository } from "../domain/IdocumentRepository.js";
import { s3Service } from "../../../services/s3.service.js";

export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: IuseCase<UploadDocumentDTO, IDocument>,
    private readonly getRoomDocumentsUseCase: IuseCase<GetRoomDocumentsDTO, IDocument[]>,
    private readonly deleteDocumentUseCase: IuseCase<DeleteDocumentDTO, void>,
    private readonly resolveWorkspaceUseCase: IuseCase<ResolveWorkspaceDTO, ResolvedWorkspaceDTO>,
    private readonly getRoomUseCase: IuseCase<GetRoomDTO, IRoomDocument | null>,
    private readonly documentRepository: IDocumentRepository
  ) {}

  private async getAccessibleRoom(req: AuthRequest, roomId: string) {
    const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
      userId: req.user?.id,
      userEmail: req.user?.userEmail,
      role: req.user?.role,
      activeWorkspaceId: req.user?.workspaceId,
    });
    const room = await this.getRoomUseCase.execute({ roomId });
    if (!room || room.workspaceId.toString() !== workspaceId) {
      throw new AppError(MESSAGES.ERRORS.ROOM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (req.user?.role === UserRoles.MEMBER && room.type !== "public") {
      const userId = req.user.id;
      const isAllowed = room.allowedUsers?.some((id: unknown) => String(id) === userId);
      if (!isAllowed) {
        throw new AppError(MESSAGES.ERRORS.PRIVATE_ROOM_ACCESS_DENIED, HttpStatus.FORBIDDEN);
      }
    }

    return { room, workspaceId };
  }

  uploadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const roomId = req.params.roomId as string;
    const userId = req.user?.id;
    const file = req.file;

    if (!roomId) {
      throw new AppError(MESSAGES.ERRORS.ROOM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const { workspaceId } = await this.getAccessibleRoom(req, roomId);

    if (!file) {
      throw new AppError(MESSAGES.ERRORS.NO_FILE_UPLOADED, HttpStatus.BAD_REQUEST);
    }

    if (!userId) {
      throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const dto: UploadDocumentDTO = {
      roomId,
      uploaderId: userId,
      originalName: file.originalname,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
      workspaceId,
    };

    const newDocument =
      await this.uploadDocumentUseCase.execute(dto);

    return ApiResposne.success(
      res,
      MESSAGES.SUCCESS.DOCUMENT_UPLOADED,
      newDocument,
      HttpStatus.CREATED
    );
  } catch (error: unknown) {
    logger.error("Upload error:", error);
    next(error);
  }
};

  getRoomDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.roomId as string;
      if (!roomId) {
        throw new AppError(MESSAGES.ERRORS.ROOM_NOT_FOUND, HttpStatus.NOT_FOUND);
      }
      await this.getAccessibleRoom(req, roomId);
      const documents = await this.getRoomDocumentsUseCase.execute({ roomId });
      return ApiResposne.success(res, MESSAGES.SUCCESS.DOCUMENTS_FETCHED, documents);
    } catch (error: unknown) {
      logger.error("Fetch documents error:", error);
      next(error);
    }
  };

  getDocumentFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.roomId as string;
      const documentId = req.params.documentId as string;
      if (!roomId || !documentId) {
        throw new AppError(MESSAGES.ERRORS.DOCUMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      await this.getAccessibleRoom(req, roomId);
      const document = await this.documentRepository.findById(documentId);
      if (!document || document.roomId.toString() !== roomId) {
        throw new AppError(MESSAGES.ERRORS.DOCUMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      const fileBuffer = await s3Service.downloadFile(document.url);
      const encodedFileName = encodeURIComponent(document.originalName);
      res.setHeader("Content-Type", document.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodedFileName}`);
      res.setHeader("Content-Length", fileBuffer.length);
      return res.status(HttpStatus.OK).send(fileBuffer);
    } catch (error: unknown) {
      logger.error("Document file fetch error:", error);
      if (error instanceof AppError) {
        next(error);
        return;
      }
      next(new AppError(MESSAGES.ERRORS.UNABLE_TO_RETRIEVE_DOCUMENT, HttpStatus.INTERNAL_SERVER_ERROR));
    }
  };

  deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.roomId as string;
      const documentId = req.params.documentId as string;
      const userId = req.user?.id;

      if (!roomId || !documentId) {
        throw new AppError(MESSAGES.ERRORS.DOCUMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
      }
      const { workspaceId } = await this.getAccessibleRoom(req, roomId);
      
      if (!userId) {
        throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      const dto: DeleteDocumentDTO = {
        documentId,
        roomId,
        userId,
        workspaceId,
      };

      await this.deleteDocumentUseCase.execute(dto);
      return ApiResposne.success(res, MESSAGES.SUCCESS.DOCUMENT_DELETED);
    } catch (error: unknown) {
      logger.error("Delete document error:", error);
      if (error instanceof AppError) {
        next(error);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "Internal server error";
      const status = errorMessage.includes("Not authorized")
        ? HttpStatus.FORBIDDEN
        : errorMessage.includes("not found")
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;
      next(new AppError(errorMessage, status));
    }
  };
}
