import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDocumentRepository } from "../../domain/IdocumentRepository.js";
import { DeleteDocumentDTO } from "../dto/documentDTO.js";
import { socketService } from "../../../../socket/socketService.js";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { MESSAGES } from "../../../../common/constant/messages.js";

export class DeleteDocumentUseCase implements IuseCase<DeleteDocumentDTO, void> {
  constructor(private readonly documentRepository: IDocumentRepository, private readonly activityLogRepository: IactivityLogRepository) {}

  async execute(data: DeleteDocumentDTO): Promise<void> {
    const document = await this.documentRepository.findById(data.documentId);
    
    if (!document) {
      throw new Error(MESSAGES.ERRORS.DOCUMENT_NOT_FOUND);
    }
    
    if (document.roomId.toString() !== data.roomId) {
      throw new Error(MESSAGES.ERRORS.DOCUMENT_NOT_IN_ROOM);
    }

    if (document.uploaderId.toString() !== data.userId) {
      throw new Error(MESSAGES.ERRORS.UNAUTHORIZED_DELETE_DOCUMENT);
    }

    await this.documentRepository.delete(data.documentId);
    
    socketService.getIO().to(`room:${data.roomId}`).emit("room:delete-document", data.documentId);

      await this.activityLogRepository.recordActivity({
            occurredAt: new Date(),
            action: "DELETE_DOCUMENT",
            actorId: data.userId,
            workspaceId: data.workspaceId,
            targetType: "DELETE",
            targetId: undefined,
            metadata: {}
          });
  }
}
