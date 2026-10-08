import { Request, Response, NextFunction } from "express";
import { IuseCase } from "../../../shared/interface/IuseCase.js";
import { UploadDocumentDTO, DeleteDocumentDTO, GetRoomDocumentsDTO } from "../application/dto/documentDTO.js";
import { IDocument } from "../infrastructure/documentSchema.js";
import logger from "../../../shared/utils/logger.js";
import { AuthRequest } from "../../../middleware/authMiddleware.js";
import { ApiResposne } from "../../../common/Response/Response.js";
import { MESSAGES } from "../../../common/constant/messages.js";
import { AppError } from "../../../common/Errors/AppError.js";

export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: IuseCase<UploadDocumentDTO, IDocument>,
    private readonly getRoomDocumentsUseCase: IuseCase<GetRoomDocumentsDTO, IDocument[]>,
    private readonly deleteDocumentUseCase: IuseCase<DeleteDocumentDTO, void>
  ) {}

  uploadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;
    const file = req.file;

    if (!file) {
      throw new AppError("No file uploaded", 400);
    }

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const dto: UploadDocumentDTO = {
      roomId,
      uploaderId: userId,
      originalName: file.originalname,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    const newDocument =
      await this.uploadDocumentUseCase.execute(dto);

    return ApiResposne.success(
      res,
      MESSAGES.SUCCESS.DOCUMENT_UPLOADED,
      newDocument,
      201
    );
  } catch (error: unknown) {
    logger.error("Upload error:", error);
    next(error);
  }
};

  getRoomDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId } = req.params;
      const documents = await this.getRoomDocumentsUseCase.execute({ roomId: roomId as string });
      return ApiResposne.success(res, MESSAGES.SUCCESS.DOCUMENTS_FETCHED, documents);
    } catch (error: unknown) {
      logger.error("Fetch documents error:", error);
      next(error);
    }
  };

  deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { roomId, documentId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const dto: DeleteDocumentDTO = {
        documentId: documentId as string,
        roomId: roomId as string,
        userId,
      };

      await this.deleteDocumentUseCase.execute(dto);
      return ApiResposne.success(res, MESSAGES.SUCCESS.DOCUMENT_DELETED);
    } catch (error: unknown) {
      logger.error("Delete document error:", error);
      const errorMessage = error instanceof Error ? error.message : "Internal server error";
      const status = errorMessage.includes("Not authorized") ? 403 : (errorMessage.includes("not found") ? 404 : 500);
      next(new AppError(errorMessage, status));
    }
  };
}
