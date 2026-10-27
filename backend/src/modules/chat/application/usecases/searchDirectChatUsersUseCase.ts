import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDirectMessageRepository } from "../../domain/IDirectMessageRepository.js";
import { EligibleUserDTO } from "../dto/directMessageDTO.js";

export class SearchDirectChatUsersUseCase
  implements
    IuseCase<
      { userId: string; workspaceId?: string; query?: string },
      EligibleUserDTO[]
    >
{
  constructor(private readonly dmRepository: IDirectMessageRepository) {}

  async execute({
    userId,
    workspaceId,
    query,
  }: {
    userId: string;
    workspaceId?: string;
    query?: string;
  }): Promise<EligibleUserDTO[]> {
    return await this.dmRepository.searchEligibleUsers(userId, workspaceId, query);
  }
}
