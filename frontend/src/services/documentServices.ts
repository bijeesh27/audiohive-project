import axiosInstance from "../config/axios";

export const uploadRoomDocument = (roomId: string, file: File) => {
  const formData = new FormData();
  formData.append("document", file);
  return axiosInstance.post(`/api/rooms/${roomId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getRoomDocuments = (roomId: string) => {
  return axiosInstance.get(`/api/rooms/${roomId}/documents`);
};

export const deleteRoomDocument = (roomId: string, documentId: string) => {
  return axiosInstance.delete(`/api/rooms/${roomId}/documents/${documentId}`);
};