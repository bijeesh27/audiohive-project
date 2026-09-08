import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { IAnnouncementDocument } from "../../infrastructure/announcementSchema.js";

export class GetAllAnnouncementsUseCase
  implements
    IuseCase<
      { workspaceId: string; page: number; limit: number; status?: string; search?: string },
      { announcements: IAnnouncementDocument[]; total: number }
    >
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(input: {
    workspaceId: string;
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{ announcements: IAnnouncementDocument[]; total: number }> {
    return await this.announcementRepository.getAllAnnouncements(
      input.workspaceId,
      input.page,
      input.limit,
      input.status,
      input.search
    );
  }
}
