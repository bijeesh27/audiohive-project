import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { AnnouncementResponseDTO, GetAnnouncementsQueryDTO } from "../dto/announcementDTO.js";

export class GetAllAnnouncementsUseCase
  implements
    IuseCase<
      GetAnnouncementsQueryDTO,
      { announcements: AnnouncementResponseDTO[]; total: number }
    >
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(input: GetAnnouncementsQueryDTO): Promise<{ announcements: AnnouncementResponseDTO[]; total: number }> {
    return await this.announcementRepository.getAllAnnouncements(
      input.workspaceId,
      input.page,
      input.limit,
      input.status,
      input.search
    );
  }
}
