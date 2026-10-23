import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { AnnouncementResponseDTO } from "../dto/announcementDTO.js";

export interface GetAnnouncementInput {
  id: string;
  workspaceId: string;
}

export class GetAnnouncementUseCase
  implements IuseCase<GetAnnouncementInput, AnnouncementResponseDTO | null>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(input: GetAnnouncementInput): Promise<AnnouncementResponseDTO | null> {
    return await this.announcementRepository.findAnnouncement(input.id, input.workspaceId);
  }
}
