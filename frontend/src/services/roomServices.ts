import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface CreateRoomData {
  name: string;
  description?: string;
  type: "public" | "private";
}

export interface UpdateRoomData {
  name?: string;
  description?: string;
  type?: "public" | "private";
  status?: "active" | "blocked";
}

export const getRooms = (page: number, limit: number, search?: string) => {
  return axiosInstance.get(API_ENDPOINTS.ROOM.GET_ALL, {
    params: { page, limit, search },
  });
};

export const getRoom = (roomId: string) => {
  return axiosInstance.get(API_ENDPOINTS.ROOM.GET_ONE(roomId));
};

export const createRoom = (data: CreateRoomData) => {
  return axiosInstance.post(API_ENDPOINTS.ROOM.CREATE, data);
};

export const updateRoom = (roomId: string, data: UpdateRoomData) => {
  return axiosInstance.put(API_ENDPOINTS.ROOM.UPDATE(roomId), data);
};

export const deleteRoom = (roomId: string) => {
  return axiosInstance.delete(API_ENDPOINTS.ROOM.DELETE(roomId));
};

export const allocateRoomUsers = (roomId: string, userIds: string[]) => {
  return axiosInstance.post(API_ENDPOINTS.ROOM.ALLOCATE(roomId), { userIds });
};

export const getRoomParticipants = (
  roomId: string,
  params?: { page?: number; limit?: number; search?: string }
) => {
  return axiosInstance.get(API_ENDPOINTS.ROOM.GET_PARTICIPANTS(roomId), {
    params,
  });
};

export const removeRoomUser = (roomId: string, userId: string) => {
  return axiosInstance.delete(API_ENDPOINTS.ROOM.REMOVE_USER(roomId, userId));
};
