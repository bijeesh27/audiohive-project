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

export interface AnnouncementAuthor {
  id: string;
  name: string;
  avatar?: string;
}

export interface MemberAnnouncement {
  id: string;
  _id?: string;
  title: string;
  content: string;
  type: "info" | "important" | "urgent" | "event" | "warning" | "critical";
  isPinned: boolean;
  isRead: boolean;
  readBy?: string[];
  author: AnnouncementAuthor;
  audience: string;
  createdAt: string;
}

export interface GetAnnouncementsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  q?: string;
  tab?: "all" | "unread" | "pinned" | string;
  type?: string;
  range?: string;
  sort?: "newest" | "oldest" | string;
}

export interface PaginatedAnnouncementsResponse {
  announcements: MemberAnnouncement[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
  pinnedCount: number;
}

export const getAnnouncements = (
  pageOrParams: number | GetAnnouncementsParams = 1,
  limit = 20,
  status?: string,
  search?: string
) => {
  const params =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit, status, search };

  return axiosInstance.get(API_ENDPOINTS.ANNOUNCEMENT.GET_ALL, { params });
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

export const markAsUnread = (id: string) => {
  return axiosInstance.patch(API_ENDPOINTS.ANNOUNCEMENT.MARK_UNREAD(id));
};

export const markAllAsRead = () => {
  return axiosInstance.patch(API_ENDPOINTS.ANNOUNCEMENT.READ_ALL);
};

export const getUnreadCount = () => {
  return axiosInstance.get(API_ENDPOINTS.ANNOUNCEMENT.UNREAD_COUNT);
};

export const getByRoom = (roomId: string) => {
  return axiosInstance.get(API_ENDPOINTS.ANNOUNCEMENT.BY_ROOM(roomId));
};
