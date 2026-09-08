import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";

type Participant = { _id: string; username: string; email: string };

export class GetRoomParticipantsUseCase implements IuseCase<string, Participant[]> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute(roomId: string): Promise<Participant[]> {
    return await this.roomRepository.getRoomParticipants(roomId);
  }
}
