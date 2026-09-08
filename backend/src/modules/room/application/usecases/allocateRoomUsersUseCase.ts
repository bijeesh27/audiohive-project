import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { AllocateRoomUsersDTO } from "../dto/roomDTO";

export class AllocateRoomUsersUseCase implements IuseCase<AllocateRoomUsersDTO, void> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute(data: AllocateRoomUsersDTO): Promise<void> {
    await this.roomRepository.updateAllowedUsers(data.roomId, data.userIds);
  }
}
