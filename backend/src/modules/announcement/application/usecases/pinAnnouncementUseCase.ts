import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { announcementQueue } from "../../../../config/announcementQueue.js";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents.js";

export class PinAnnouncementUseCase
  implements IuseCase<{ id: string; isPinned: boolean; workspaceId: string }, void>
{
  constructor(
    private readonly announcementRepository: IAnnouncementRepository
  ) {}

  async execute(input: {
    id: string;
    isPinned: boolean;
    workspaceId: string;
  }): Promise<void> {
    await this.announcementRepository.pinAnnouncement(input.id, input.isPinned);

    await announcementQueue.add("pin-announcement", {
      event: SOCKET_EVENTS.PIN_ANNOUNCEMENT,
      announcementId: input.id,
      isPinned: input.isPinned,
      workspaceId: input.workspaceId,
    });
  }
}
