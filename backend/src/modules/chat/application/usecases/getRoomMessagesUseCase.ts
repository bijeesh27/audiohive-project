import { IuseCase } from "../../../../shared/interface/IuseCase";
import {
  IChatMessageRepository,
  GetRoomMessagesOptions,
  PaginatedChatMessages,
} from "../../domain/IChatMessageRepository";

export class GetRoomMessagesUseCase
  implements
    IuseCase<{ roomId: string; options: GetRoomMessagesOptions }, PaginatedChatMessages>
{
  constructor(private readonly chatRepo: IChatMessageRepository) {}

  async execute(params: {
    roomId: string;
    options: GetRoomMessagesOptions;
  }): Promise<PaginatedChatMessages> {
    return this.chatRepo.getRoomMessages(params.roomId, params.options);
  }
}
