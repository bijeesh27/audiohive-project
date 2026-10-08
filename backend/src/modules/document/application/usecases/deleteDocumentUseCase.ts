import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDocumentRepository } from "../../domain/IdocumentRepository.js";
import { DeleteDocumentDTO } from "../dto/documentDTO.js";
import { socketService } from "../../../../socket/socketService.js";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class DeleteDocumentUseCase implements IuseCase<DeleteDocumentDTO, void> {
  constructor(private readonly documentRepository: IDocumentRepository, private readonly activityLogRepository: IactivityLogRepository) {}

  async execute(data: DeleteDocumentDTO): Promise<void> {
    const document = await this.documentRepository.findById(data.documentId);
    
    if (!document) {
      throw new Error("Document not found");
    }
    
    if (document.roomId.toString() !== data.roomId) {
      throw new Error("Document not found in this room");
    }

    if (document.uploaderId.toString() !== data.userId) {
      throw new Error("Not authorized to delete this document");
    }

    await this.documentRepository.delete(data.documentId);
    
    socketService.getIO().to(`room:${data.roomId}`).emit("room:delete-document", data.documentId);

      await this.activityLogRepository.recordActivity({
            occurredAt: new Date(),
            action: "DELETE_DOCUMENT",
            actorId: data ? (data as any).actorId || (data as any).userId || (data as any).uploaderId || null : null,
            organizationId: data ? (data as any).organizationId : undefined,
            workspaceId: data ? (data as any).workspaceId || (data as any).roomId : undefined,
            targetType: "DELETE",
            targetId: undefined,
            metadata: {}
          });
  }
}
