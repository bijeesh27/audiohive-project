import {
  AnnouncementResponseDTO,
  PaginatedAnnouncementsResultDTO,
} from "../application/dto/announcementDTO.js";

export interface IAnnouncementRepository {
  createAnnouncement(data: Partial<AnnouncementResponseDTO>): Promise<AnnouncementResponseDTO>;
  updateAnnouncement(id: string, workspaceId: string, data: Partial<AnnouncementResponseDTO>): Promise<void>;
  deleteAnnouncement(id: string, workspaceId: string): Promise<void>;
  findAnnouncement(id: string, workspaceId: string): Promise<AnnouncementResponseDTO | null>;
  getAllAnnouncements(
    workspaceId: string,
    page: number,
    limit: number,
    status?: string,
    search?: string,
    filters?: {
      q?: string;
      tab?: string;
      type?: string;
      range?: string;
      sort?: string;
      userId?: string;
    }
  ): Promise<PaginatedAnnouncementsResultDTO>;
  pinAnnouncement(id: string, workspaceId: string, isPinned: boolean): Promise<void>;
  markAsRead(id: string, workspaceId: string, userId: string): Promise<void>;
  markAsUnread(id: string, workspaceId: string, userId: string): Promise<void>;
  markAllAsRead(workspaceId: string, userId: string): Promise<number>;
  getUnreadCount(workspaceId: string, userId: string): Promise<number>;
  getPinnedCount(workspaceId: string): Promise<number>;
  getByRoom(roomId: string, workspaceId: string): Promise<AnnouncementResponseDTO[]>;
}
