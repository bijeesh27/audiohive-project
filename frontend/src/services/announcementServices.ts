import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: "info" | "warning" | "critical" | "event";
  targetAudience: "all" | "room-specific";
  status: "draft" | "published";
  isPinned?: boolean;
  roomId?: string;
  scheduledAt?: string;
  expiresAt?: string;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  type?: "info" | "warning" | "critical" | "event";
  targetAudience?: "all" | "room-specific";
  roomId?: string;
  isPinned?: boolean;
  status?: "draft" | "published" | "archived";
  expiresAt?: string;
}

export interface AnnouncementAuthor {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface MemberAnnouncement {
  id: string;
  _id?: string;
  title: string;
  content: string;
  type: "info" | "important" | "urgent" | "event" | "warning" | "critical";
  status: "draft" | "published" | "archived";
  isPinned: boolean;
  targetAudience?: "all" | "room-specific";
  roomId?: string | null;
  isRead: boolean;
  readBy?: string[];
  readCount?: number;
  totalMembersCount?: number;
  author: AnnouncementAuthor;
  audience: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
}

export interface AnnouncementCounts {
  all: number;
  published: number;
  draft: number;
  archived: number;
  pinned: number;
}

export interface GetAnnouncementsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  q?: string;
  tab?: "all" | "published" | "draft" | "archived" | "pinned" | "unread" | string;
  type?: string;
  range?: string;
  sort?: "newest" | "oldest" | "most_read" | "least_read" | string;
}

export interface PaginatedAnnouncementsResponse {
  items?: MemberAnnouncement[];
  announcements: MemberAnnouncement[];
  pinnedItems?: MemberAnnouncement[];
  total: number;
  page: number;
  limit?: number;
  totalPages: number;
  totalMembersCount?: number;
  counts?: AnnouncementCounts;
  unreadCount?: number;
  pinnedCount?: number;
}

export interface AnnouncementReaderUser {
  _id: string;
  username: string;
  email: string;
  role?: string;
  avatar?: string;
}

export interface AnnouncementReadersResponse {
  totalMembers: number;
  readCount: number;
  unreadCount: number;
  readMembers: AnnouncementReaderUser[];
  unreadMembers: AnnouncementReaderUser[];
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

export const getAnnouncementReaders = (id: string) => {
  return axiosInstance.get(API_ENDPOINTS.ANNOUNCEMENT.GET_READERS(id));
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
