import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { GetRoomParticipantsDTO, GetRoomParticipantsResultDTO } from "../dto/roomDTO";

export class GetRoomParticipantsUseCase implements IuseCase<GetRoomParticipantsDTO, GetRoomParticipantsResultDTO> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute(input: GetRoomParticipantsDTO): Promise<GetRoomParticipantsResultDTO> {
    const { roomId, page, limit, search } = input;
    return await this.roomRepository.getRoomParticipants(roomId, page, limit, search);
  }
}
