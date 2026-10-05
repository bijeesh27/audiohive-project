import { IDocument, DocumentModel } from "./documentSchema.js";
import { IDocumentRepository } from "../domain/IdocumentRepository.js";

export class DocumentRepository implements IDocumentRepository {
  async create(data: Partial<IDocument>): Promise<IDocument> {
    const newDocument = await DocumentModel.create(data);
    await newDocument.populate("uploaderId", "username email");
    return newDocument;
  }

  async findByRoomId(roomId: string): Promise<IDocument[]> {
    return DocumentModel.find({ roomId })
      .populate("uploaderId", "username email")
      .sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<IDocument | null> {
    return DocumentModel.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await DocumentModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
