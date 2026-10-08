export interface CreateAnnouncementDTO {
  organizationId: string;
  workspaceId: string;
  roomId?: string;
  title: string;
  content: string;
  type: "info" | "warning" | "critical" | "event";
  targetAudience: "all" | "room-specific";
  status: "draft" | "published";
  isScheduled?: boolean;
  scheduledAt?: string;
  expiresAt?: string;
  createdBy: string;
}

export interface UpdateAnnouncementDTO {
  title?: string;
  content?: string;
  type?: "info" | "warning" | "critical" | "event";
  status?: "draft" | "published" | "archived";
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
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

