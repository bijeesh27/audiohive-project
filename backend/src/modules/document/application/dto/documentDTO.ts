export interface UploadDocumentDTO {
  roomId: string;
  uploaderId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
  workspaceId: string;
}

export interface DeleteDocumentDTO {
  documentId: string;
  roomId: string;
  userId: string;
  workspaceId: string;
}

export interface GetRoomDocumentsDTO {
  roomId: string;
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
