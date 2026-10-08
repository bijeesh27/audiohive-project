import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDocumentRepository } from "../../domain/IdocumentRepository.js";
import { UploadDocumentDTO } from "../dto/documentDTO.js";
import { IDocument } from "../../infrastructure/documentSchema.js";
import { socketService } from "../../../../socket/socketService.js";
import { Types } from "mongoose";
import {s3Service } from "../../../../services/s3.service";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class UploadDocumentUseCase
  implements IuseCase<UploadDocumentDTO, IDocument> {

  constructor(
    private readonly documentRepository: IDocumentRepository, private readonly activityLogRepository: IactivityLogRepository
  ) {}

  async execute(data: UploadDocumentDTO): Promise<IDocument> {

    // 1. Upload file to S3
    const fileKey = await s3Service.uploadFile({
      buffer: data.buffer,
      fileName: data.fileName,
      mimeType: data.mimeType,
    });

    // 2. Prepare document data
    const documentData = {
      roomId: new Types.ObjectId(data.roomId),
      uploaderId: new Types.ObjectId(data.uploaderId),
      originalName: data.originalName,
      fileName: data.fileName,
      mimeType: data.mimeType,
      size: data.size,
      url: fileKey,
    };
  

    // 3. Save metadata in MongoDB
    const document = await this.documentRepository.create(documentData);

    // 4. Notify everyone in the room
    socketService
      .getIO()
      .to(`room:${data.roomId}`)
      .emit("room:new-document", document);

      await this.activityLogRepository.recordActivity({
            occurredAt: new Date(),
            action: "UPLOAD_DOCUMENT",
            actorId: data ? (data as any).actorId || (data as any).userId || (data as any).uploaderId || null : null,
            organizationId: data ? (data as any).organizationId : undefined,
            workspaceId: data ? (data as any).workspaceId || (data as any).roomId : undefined,
            targetType: "UPLOAD",
            targetId: undefined,
            metadata: {}
          });


    return document;
  }
}