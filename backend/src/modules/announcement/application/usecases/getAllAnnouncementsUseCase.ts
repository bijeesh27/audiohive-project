import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import {
  GetAnnouncementsQueryDTO,
  PaginatedAnnouncementsResultDTO,
} from "../dto/announcementDTO.js";

export class GetAllAnnouncementsUseCase
  implements
    IuseCase<
      GetAnnouncementsQueryDTO,
      PaginatedAnnouncementsResultDTO
    >
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(input: GetAnnouncementsQueryDTO): Promise<PaginatedAnnouncementsResultDTO> {
    return await this.announcementRepository.getAllAnnouncements(
      input.workspaceId,
      input.page,
      input.limit,
      input.status,
      input.search,
      {
        q: input.q,
        tab: input.tab,
        type: input.type,
        range: input.range,
        sort: input.sort,
        userId: input.userId,
      }
    );
  }
}
