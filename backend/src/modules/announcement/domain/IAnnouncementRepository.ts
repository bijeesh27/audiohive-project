import { AnnouncementResponseDTO } from "../application/dto/announcementDTO.js";

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
    search?: string
  ): Promise<{ announcements: AnnouncementResponseDTO[]; total: number }>;
  pinAnnouncement(id: string, workspaceId: string, isPinned: boolean): Promise<void>;
  markAsRead(id: string, workspaceId: string, userId: string): Promise<void>;
  getUnreadCount(workspaceId: string, userId: string): Promise<number>;
  getByRoom(roomId: string, workspaceId: string): Promise<AnnouncementResponseDTO[]>;
}
