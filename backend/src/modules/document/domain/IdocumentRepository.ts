import { IDocument } from "../infrastructure/documentSchema.js";

export interface IDocumentRepository {
  create(data: Partial<IDocument>): Promise<IDocument>;
  findByRoomId(roomId: string): Promise<IDocument[]>;
  findById(id: string): Promise<IDocument | null>;
  delete(id: string): Promise<boolean>;
}
