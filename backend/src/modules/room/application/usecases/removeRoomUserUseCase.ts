import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { RemoveRoomUserDTO } from "../dto/roomDTO";

export class RemoveRoomUserUseCase implements IuseCase<RemoveRoomUserDTO, void> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute(data: RemoveRoomUserDTO): Promise<void> {
    await this.roomRepository.removeRoomUser(data.roomId, data.userId);
  }
}
