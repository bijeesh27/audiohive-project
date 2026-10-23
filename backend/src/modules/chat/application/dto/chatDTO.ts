export interface SendMessageInputDTO {
  roomId: string;
  workspaceId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type?: "text" | "system" | "file";
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
}

export interface ChatMessageResponseDTO {
  id: string;
  roomId: string;
  workspaceId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  createdAt: string;
}
