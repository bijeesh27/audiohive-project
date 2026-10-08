import { AnnouncementResponseDTO } from "../application/dto/announcementDTO.js";

export interface IAnnouncementRepository {
  createAnnouncement(data: Partial<AnnouncementResponseDTO>): Promise<AnnouncementResponseDTO>;
  updateAnnouncement(id: string, data: Partial<AnnouncementResponseDTO>): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;
  findAnnouncement(id: string): Promise<AnnouncementResponseDTO | null>;
  getAllAnnouncements(
    workspaceId: string,
    page: number,
    limit: number,
    status?: string,
    search?: string
  ): Promise<{ announcements: AnnouncementResponseDTO[]; total: number }>;
  pinAnnouncement(id: string, isPinned: boolean): Promise<void>;
  markAsRead(id: string, userId: string): Promise<void>;
  getUnreadCount(workspaceId: string, userId: string): Promise<number>;
  getByRoom(roomId: string): Promise<AnnouncementResponseDTO[]>;
}
