import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IroomRepository } from "../../domain/IroomRepository.js";
import { ValidateRoomAccessDTO } from "../dto/roomDTO.js";
import { UserRoles } from "../../../../common/constant/userRoles.js";

export class ValidateRoomAccessUseCase
  implements IuseCase<ValidateRoomAccessDTO, boolean>
{
  constructor(private readonly roomRepository: IroomRepository) {}

  async execute(input: ValidateRoomAccessDTO): Promise<boolean> {
    const { roomId, workspaceId, userId, role } = input;
    if (!roomId) return false;

    const room = await this.roomRepository.findRoom(roomId);
    if (!room) return false;

    const roomWorkspaceId = room.workspaceId?.toString();
    if (workspaceId && roomWorkspaceId && roomWorkspaceId !== workspaceId) {
      return false;
    }

    if (role && role !== UserRoles.MEMBER) {
      return true;
    }

    if (room.type === "public") {
      return true;
    }

    if (!room.allowedUsers || !Array.isArray(room.allowedUsers)) {
      return false;
    }

    return room.allowedUsers.some((id) => id && id.toString() === userId);
  }
}
