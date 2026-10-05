import { IuseCase } from "../../../../shared/interface/IuseCase";
import logger from "../../../../shared/utils/logger";
import { IroomRepository } from "../../domain/IroomRepository";
import { AllocateRoomUsersDTO } from "../dto/roomDTO";

export class AllocateRoomUsersUseCase implements IuseCase<AllocateRoomUsersDTO, void> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute(data: AllocateRoomUsersDTO): Promise<void> {
    const totalUser=await this.roomRepository.getRoomParticipants(data.roomId)
    logger.info(totalUser)
    await this.roomRepository.updateAllowedUsers(data.roomId, data.userIds);
  }
}
