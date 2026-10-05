import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDocumentRepository } from "../../domain/IdocumentRepository.js";
import { DeleteDocumentDTO } from "../dto/documentDTO.js";
import { socketService } from "../../../../socket/socketService.js";

export class DeleteDocumentUseCase implements IuseCase<DeleteDocumentDTO, void> {
  constructor(private readonly documentRepository: IDocumentRepository) {}

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
  }
}
