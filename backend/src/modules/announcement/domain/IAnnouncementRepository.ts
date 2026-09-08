import { IAnnouncementDocument } from "../infrastructure/announcementSchema";

export interface IAnnouncementRepository {
  createAnnouncement(data: Partial<IAnnouncementDocument>): Promise<IAnnouncementDocument>;
  updateAnnouncement(id: string, data: Partial<IAnnouncementDocument>): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;
  findAnnouncement(id: string): Promise<IAnnouncementDocument | null>;
  getAllAnnouncements(
    workspaceId: string,
    page: number,
    limit: number,
    status?: string,
    search?: string
  ): Promise<{ announcements: IAnnouncementDocument[]; total: number }>;
  pinAnnouncement(id: string, isPinned: boolean): Promise<void>;
  markAsRead(id: string, userId: string): Promise<void>;
  getUnreadCount(workspaceId: string, userId: string): Promise<number>;
  getByRoom(roomId: string): Promise<IAnnouncementDocument[]>;
}
