import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { MarkReadDTO } from "../dto/announcementDTO.js";

export class MarkAsReadUseCase implements IuseCase<MarkReadDTO, void> {
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(input: MarkReadDTO): Promise<void> {
    await this.announcementRepository.markAsRead(
      input.announcementId,
      input.userId
    );
  }
}
