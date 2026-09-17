import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { CreateAnnouncementDTO } from "../dto/announcementDTO.js";
import { IAnnouncementDocument } from "../../infrastructure/announcementSchema.js";
import { announcementQueue } from "../../../../config/announcementQueue.js";

export class CreateAnnouncementUseCase
  implements IuseCase<CreateAnnouncementDTO, IAnnouncementDocument>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(data: CreateAnnouncementDTO): Promise<IAnnouncementDocument> {
    const saved = await this.announcementRepository.createAnnouncement(
      data as unknown as Partial<IAnnouncementDocument>
    );

    if (data.status === "published") {
      await announcementQueue.add("publish-announcement", {
        announcement: saved,
        workspaceId: data.workspaceId,
      });
    }

    return saved;
  }
}
