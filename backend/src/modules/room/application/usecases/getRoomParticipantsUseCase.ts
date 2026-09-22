import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";

type Participant = { _id: string; username: string; email: string; role: string; status: boolean };
type ParticipantsResult = { participants: Participant[]; total: number };
type ParticipantsInput = { roomId: string; page?: number; limit?: number; search?: string };

export class GetRoomParticipantsUseCase implements IuseCase<ParticipantsInput, ParticipantsResult> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute(input: ParticipantsInput): Promise<ParticipantsResult> {
    const { roomId, page, limit, search } = input;
    return await this.roomRepository.getRoomParticipants(roomId, page, limit, search);
  }
}
