export interface UploadDocumentDTO {
  roomId: string;
  uploaderId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  buffer: Buffer;
}

export interface DeleteDocumentDTO {
  documentId: string;
  roomId: string;
  userId: string;
}

export interface DocumentResponseDTO {
  id: string;
  roomId: string;
  uploaderId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
}
