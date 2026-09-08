import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { UpdateRoomDTO } from "../dto/roomDTO";

export class UpdateRoomUseCase implements IuseCase<{ roomId: string; data: UpdateRoomDTO }, void> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute({ roomId, data }: { roomId: string; data: UpdateRoomDTO }): Promise<void> {
    if (data.type === "private") {
      data.isPrivate = true;
    } else if (data.type === "public") {
      data.isPrivate = false;
    }
    await this.roomRepository.updateRoom(roomId, data as unknown as any);
  }
}
