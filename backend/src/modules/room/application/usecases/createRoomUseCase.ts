import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { CreateRoomDTO } from "../dto/roomDTO";
import { IRoomDocument } from "../../infrastructure/roomSchema";

export class CreateRoomUseCase implements IuseCase<CreateRoomDTO, void> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute(data: CreateRoomDTO): Promise<void> {
    if (data.type === "private") {
      data.isPrivate = true;
    } else {
      data.isPrivate = false;
    }
    await this.roomRepository.createRoom(data as unknown as IRoomDocument);
  }
}
