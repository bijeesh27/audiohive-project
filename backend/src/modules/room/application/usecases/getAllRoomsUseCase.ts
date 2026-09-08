import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { IRoomDocument } from "../../infrastructure/roomSchema";

export class GetAllRoomsUseCase implements IuseCase<{ workspaceId: string; page: number; limit: number; search?: string, userId?: string, role?: string }, { rooms: IRoomDocument[]; total: number }> {
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute({ workspaceId, page, limit, search, userId, role }: { workspaceId: string; page: number; limit: number; search?: string, userId?: string, role?: string }): Promise<{ rooms: IRoomDocument[]; total: number }> {
    return await this.roomRepository.getAllRooms(workspaceId, page, limit, search, userId, role);
  }
}
