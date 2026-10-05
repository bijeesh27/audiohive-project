import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDocumentRepository } from "../../domain/IdocumentRepository.js";
import { IDocument } from "../../infrastructure/documentSchema.js";

export class GetRoomDocumentsUseCase implements IuseCase<string, IDocument[]> {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(roomId: string): Promise<IDocument[]> {
    const documents = await this.documentRepository.findByRoomId(roomId);
    return documents;
  }
}
