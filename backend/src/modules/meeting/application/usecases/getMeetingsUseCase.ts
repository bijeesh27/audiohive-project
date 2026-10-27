import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { ImeetingRepository } from "../../domain/ImeetingRepository.js";
import { GetMeetingsDTO } from "../dto/meetingDTO.js";
import { IMeetingDocument } from "../../infrastructure/meetingSchema.js";
import { UserRoles } from "../../../../common/constant/userRoles.js";

export class GetMeetingsUseCase
  implements IuseCase<GetMeetingsDTO, { meetings: IMeetingDocument[]; total: number }>
{
  constructor(private readonly meetingRepository: ImeetingRepository) {}

  async execute(
    input: GetMeetingsDTO
  ): Promise<{ meetings: IMeetingDocument[]; total: number }> {
    const { workspaceId, userId, userRole, page = 1, limit = 20, status } = input;

    // For members, only return meetings they host or are invited to
    const filterUserId = userRole === UserRoles.MEMBER ? userId : undefined;

    return await this.meetingRepository.getWorkspaceMeetings(
      workspaceId,
      page,
      limit,
      status,
      filterUserId
    );
  }
}
