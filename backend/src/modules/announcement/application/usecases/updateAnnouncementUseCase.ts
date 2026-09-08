import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { UpdateAnnouncementDTO } from "../dto/announcementDTO.js";

export class UpdateAnnouncementUseCase
  implements IuseCase<{ id: string; data: UpdateAnnouncementDTO }, void>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(input: { id: string; data: UpdateAnnouncementDTO }): Promise<void> {
    await this.announcementRepository.updateAnnouncement(input.id, input.data as any);
  }
}
