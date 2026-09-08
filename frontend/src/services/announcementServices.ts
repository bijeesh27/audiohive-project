import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: "info" | "warning" | "critical" | "event";
  targetAudience: "all" | "room-specific";
  status: "draft" | "published";
  roomId?: string;
  scheduledAt?: string;
  expiresAt?: string;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  type?: "info" | "warning" | "critical" | "event";
  status?: "draft" | "published" | "archived";
  expiresAt?: string;
}

export const getAnnouncements = (page = 1, limit = 20, status?: string, search?: string) => {
  return axiosInstance.get(API_ENDPOINTS.ANNOUNCEMENT.GET_ALL, {
    params: { page, limit, status, search },
  });
};

export const getAnnouncement = (id: string) => {
  return axiosInstance.get(API_ENDPOINTS.ANNOUNCEMENT.GET_ONE(id));
};

export const createAnnouncement = (data: CreateAnnouncementData) => {
  return axiosInstance.post(API_ENDPOINTS.ANNOUNCEMENT.CREATE, data);
};

export const updateAnnouncement = (id: string, data: UpdateAnnouncementData) => {
  return axiosInstance.put(API_ENDPOINTS.ANNOUNCEMENT.UPDATE(id), data);
};

export const deleteAnnouncement = (id: string) => {
  return axiosInstance.delete(API_ENDPOINTS.ANNOUNCEMENT.DELETE(id));
};

export const pinAnnouncement = (id: string, isPinned: boolean) => {
  return axiosInstance.patch(API_ENDPOINTS.ANNOUNCEMENT.PIN(id), { isPinned });
};

export const markAsRead = (id: string) => {
  return axiosInstance.patch(API_ENDPOINTS.ANNOUNCEMENT.MARK_READ(id));
};

export const getUnreadCount = () => {
  return axiosInstance.get(API_ENDPOINTS.ANNOUNCEMENT.UNREAD_COUNT);
};

export const getByRoom = (roomId: string) => {
  return axiosInstance.get(API_ENDPOINTS.ANNOUNCEMENT.BY_ROOM(roomId));
};
