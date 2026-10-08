import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDocumentRepository } from "../../domain/IdocumentRepository.js";
import { IDocument } from "../../infrastructure/documentSchema.js";
import { GetRoomDocumentsDTO } from "../dto/documentDTO.js";

export class GetRoomDocumentsUseCase implements IuseCase<GetRoomDocumentsDTO, IDocument[]> {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute({ roomId }: GetRoomDocumentsDTO): Promise<IDocument[]> {
    const documents = await this.documentRepository.findByRoomId(roomId);
    return documents;
  }
}
