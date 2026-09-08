import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { IRoomDocument } from "../../infrastructure/roomSchema";

export class GetRoomUseCase implements IuseCase<string, IRoomDocument | null> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute(roomId: string): Promise<IRoomDocument | null> {
    return await this.roomRepository.findRoom(roomId);
  }
}
