import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IAnnouncementRepository } from "../../domain/IAnnouncementRepository.js";

export interface GetAnnouncementReadersInput {
  id: string;
  workspaceId: string;
}

export interface GetAnnouncementReadersResult {
  totalMembers: number;
  readCount: number;
  unreadCount: number;
  readMembers: Array<{ _id: string; username: string; email: string; role?: string; avatar?: string }>;
  unreadMembers: Array<{ _id: string; username: string; email: string; role?: string; avatar?: string }>;
}

export class GetAnnouncementReadersUseCase
  implements IuseCase<GetAnnouncementReadersInput, GetAnnouncementReadersResult>
{
  constructor(private readonly announcementRepository: IAnnouncementRepository) {}

  async execute(input: GetAnnouncementReadersInput): Promise<GetAnnouncementReadersResult> {
    return await this.announcementRepository.getAnnouncementReaders(
      input.id,
      input.workspaceId
    );
  }
}

