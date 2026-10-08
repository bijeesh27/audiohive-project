import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { IRoomDocument } from "../../infrastructure/roomSchema";
import { GetRoomDTO } from "../dto/roomDTO";

export class GetRoomUseCase implements IuseCase<GetRoomDTO, IRoomDocument | null> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute({ roomId }: GetRoomDTO): Promise<IRoomDocument | null> {
    return await this.roomRepository.findRoom(roomId);
  }
}
