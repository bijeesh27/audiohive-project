import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export const uploadRoomDocument = (roomId: string, file: File) => {
  const formData = new FormData();
  formData.append("document", file);
  return axiosInstance.post(API_ENDPOINTS.DOCUMENT.UPLOAD(roomId), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getRoomDocuments = (roomId: string) => {
  return axiosInstance.get(API_ENDPOINTS.DOCUMENT.GET_ALL(roomId));
};

export const getRoomDocumentFile = (roomId: string, documentId: string) => {
  return axiosInstance.get(API_ENDPOINTS.DOCUMENT.GET_FILE(roomId, documentId), {
    responseType: "blob",
  });
};

export const deleteRoomDocument = (roomId: string, documentId: string) => {
  return axiosInstance.delete(API_ENDPOINTS.DOCUMENT.DELETE(roomId, documentId));
};
