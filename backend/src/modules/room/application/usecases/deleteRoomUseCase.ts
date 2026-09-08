import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";

export class DeleteRoomUseCase implements IuseCase<string, void> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute(roomId: string): Promise<void> {
    await this.roomRepository.deleteRoom(roomId);
  }
}
