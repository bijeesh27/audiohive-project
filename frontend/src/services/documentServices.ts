import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface DocumentFileResponse {
  downloadUrl: string;
  fileName: string;
  mimeType: string;
}

export const uploadRoomDocument = (
  roomId: string,
  file: File,
  onProgress?: (percent: number) => void
) => {
  const formData = new FormData();
  formData.append("document", file);
  return axiosInstance.post(API_ENDPOINTS.DOCUMENT.UPLOAD(roomId), formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
};

export const getRoomDocuments = (roomId: string) => {
  return axiosInstance.get(API_ENDPOINTS.DOCUMENT.GET_ALL(roomId));
};

export const getRoomDocumentFile = (roomId: string, documentId: string) => {
  return axiosInstance.get<{ success: boolean; message: string; data: DocumentFileResponse }>(
    API_ENDPOINTS.DOCUMENT.GET_FILE(roomId, documentId)
  );
};

export const deleteRoomDocument = (roomId: string, documentId: string) => {
  return axiosInstance.delete(API_ENDPOINTS.DOCUMENT.DELETE(roomId, documentId));
};

export const renameRoomDocument = (roomId: string, documentId: string, name: string) => {
  return axiosInstance.patch(`/api/rooms/${roomId}/documents/${documentId}/rename`, { name });
};
