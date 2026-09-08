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
}

export interface PinAnnouncementDTO {
  announcementId: string;
  isPinned: boolean;
}

export interface MarkReadDTO {
  announcementId: string;
  userId: string;
}
