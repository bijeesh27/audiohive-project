import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { announcementQueue } from "../../../../config/announcementQueue.js";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents.js";

export class DeleteAnnouncementUseCase
  implements IuseCase<{ id: string; workspaceId: string }, void>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(input: { id: string; workspaceId: string }): Promise<void> {
    await this.announcementRepository.deleteAnnouncement(input.id);

    await announcementQueue.add("delete-announcement", {
      event: SOCKET_EVENTS.DELETE_ANNOUNCEMENT,
      announcementId: input.id,
      workspaceId: input.workspaceId,
    });
  }
}
