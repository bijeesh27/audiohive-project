import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { GetAllRoomsDTO, GetAllRoomsResultDTO } from "../dto/roomDTO";

export class GetAllRoomsUseCase implements IuseCase<GetAllRoomsDTO, GetAllRoomsResultDTO> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute({ workspaceId, page, limit, search, userId, role }: GetAllRoomsDTO): Promise<GetAllRoomsResultDTO> {
    return await this.roomRepository.getAllRooms(workspaceId, page, limit, search, userId, role);
  }
}
