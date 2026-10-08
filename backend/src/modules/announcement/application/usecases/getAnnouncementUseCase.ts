import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { AnnouncementResponseDTO } from "../dto/announcementDTO.js";

export class GetAnnouncementUseCase
  implements IuseCase<string, AnnouncementResponseDTO | null>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(id: string): Promise<AnnouncementResponseDTO | null> {
    return await this.announcementRepository.findAnnouncement(id);
  }
}
