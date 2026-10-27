import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IDirectMessageRepository } from "../../domain/IDirectMessageRepository.js";

export class GetDirectChatUnreadCountUseCase
  implements IuseCase<{ userId: string }, { unreadCount: number }>
{
  constructor(private readonly dmRepository: IDirectMessageRepository) {}

  async execute({ userId }: { userId: string }): Promise<{ unreadCount: number }> {
    const unreadCount = await this.dmRepository.getTotalUnreadCount(userId);
    return { unreadCount };
  }
}
