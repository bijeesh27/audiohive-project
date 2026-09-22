import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";
import { CreateAnnouncementDTO } from "../dto/announcementDTO.js";
import { IAnnouncementDocument } from "../../infrastructure/announcementSchema.js";
import { socketService } from "../../../../socket/socketService.js";
import { SOCKET_EVENTS } from "../../../../socket/socketEvents.js";

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

    // Emit directly — no queue dependency. If the DB save succeeded,
    // the live event is guaranteed to fire immediately.
    if (data.status === "published") {
      socketService.emitToWorkspace(
        data.workspaceId,
        SOCKET_EVENTS.NEW_ANNOUNCEMENT,
        saved
      );
    }

    return saved;
  }
}

