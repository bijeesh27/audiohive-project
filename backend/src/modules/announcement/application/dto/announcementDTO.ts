export interface CreateAnnouncementDTO {
  organizationId: string;
  workspaceId: string;
  roomId?: string;
  title: string;
  content: string;
  type: "info" | "warning" | "critical" | "event";
  targetAudience: "all" | "room-specific";
  status: "draft" | "published";
  isPinned?: boolean;
  isScheduled?: boolean;
  scheduledAt?: string;
  expiresAt?: string;
  createdBy: string;
}

export interface UpdateAnnouncementDTO {
  title?: string;
  content?: string;
  type?: "info" | "warning" | "critical" | "event";
  targetAudience?: "all" | "room-specific";
  roomId?: string;
  status?: "draft" | "published" | "archived";
  isPinned?: boolean;
  expiresAt?: string;
  actorId?: string;
  workspaceId?: string;
  organizationId?: string;
}

export interface PinAnnouncementDTO {
  announcementId: string;
  isPinned: boolean;
}

export interface MarkReadDTO {
  announcementId: string;
  userId: string;
  workspaceId: string;
}

export interface AnnouncementResponseDTO {
  id: string;
  organizationId: string;
  workspaceId: string;
  roomId?: string;
  title: string;
  content: string;
  type: string;
  targetAudience: string;
  status: string;
  isScheduled: boolean;
  scheduledAt?: Date;
  expiresAt?: Date;
  isPinned: boolean;
  createdBy: string;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeleteAnnouncementDTO {
  id: string;
  workspaceId: string;
  organizationId?: string;
  actorId?: string;
}

export interface PinAnnouncementInputDTO {
  id: string;
  isPinned: boolean;
  workspaceId: string;
  organizationId?: string;
  actorId?: string;
}

export interface GetAnnouncementsQueryDTO {
  workspaceId: string;
  userId?: string;
  page: number;
  limit: number;
  status?: string;
  search?: string;
  q?: string;
  tab?: string;
  type?: string;
  range?: string;
  sort?: string;
}

export interface AnnouncementCountsDTO {
  all: number;
  published: number;
  draft: number;
  archived: number;
  pinned: number;
}

export interface AnnouncementAuthorDTO {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface AnnouncementItemDTO {
  id: string;
  _id: string;
  title: string;
  content: string;
  type: string;
  status: "published" | "draft" | "archived";
  isPinned: boolean;
  targetAudience: "all" | "room-specific";
  roomId?: string | null;
  isRead: boolean;
  readBy: string[];
  readCount: number;
  totalMembersCount?: number;
  author: AnnouncementAuthorDTO;
  audience: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  expiresAt?: Date | null;
}

export interface MemberAnnouncementDTO {
  id: string;
  _id?: string;
  title: string;
  content: string;
  type: string;
  status?: "published" | "draft" | "archived";
  isPinned: boolean;
  isRead: boolean;
  readBy?: string[];
  readCount?: number;
  author: AnnouncementAuthorDTO;
  audience: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface PaginatedAnnouncementsResultDTO {
  items: AnnouncementItemDTO[];
  announcements?: (AnnouncementResponseDTO | MemberAnnouncementDTO | AnnouncementItemDTO)[];
  pinnedItems?: AnnouncementItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalMembersCount: number;
  counts: AnnouncementCountsDTO;
  unreadCount?: number;
  pinnedCount?: number;
}

