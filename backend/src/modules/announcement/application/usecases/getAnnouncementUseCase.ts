import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { IAnnouncementDocument } from "../../infrastructure/announcementSchema.js";

export class GetAnnouncementUseCase
  implements IuseCase<string, IAnnouncementDocument | null>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(id: string): Promise<IAnnouncementDocument | null> {
    return await this.announcementRepository.findAnnouncement(id);
  }
}
