import mongoose from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import { IroomRepository } from "../../room/domain/IroomRepository.js";
import { ImeetingRepository } from "../../domain/ImeetingRepository.js";
import { UserRoles } from "../../../../common/constant/userRoles.js";

export interface ValidateCallAccessDTO {
  roomId: string;
  workspaceId?: string;
  userId: string;
  role: string;
}

export class ValidateCallAccessUseCase
  implements IuseCase<ValidateCallAccessDTO, boolean>
{
  constructor(
    private readonly roomRepository: IroomRepository,
    private readonly meetingRepository: ImeetingRepository
  ) {}

  async execute(input: ValidateCallAccessDTO): Promise<boolean> {
    const { roomId, workspaceId, userId, role } = input;
    if (!roomId) return false;

    // 1. Check if roomId is an existing persistent Room
    if (mongoose.Types.ObjectId.isValid(roomId)) {
      try {
        const room = await this.roomRepository.findRoom(roomId);
        if (room) {
          if (workspaceId && room.workspaceId.toString() !== workspaceId) {
            return false;
          }
          if (role !== UserRoles.MEMBER || room.type === "public") {
            return true;
          }
          return room.allowedUsers.some((id) => id.toString() === userId);
        }
      } catch {
        // Fall through to check meeting
      }
    }

    // 2. Check if roomId is an existing Meeting (by MongoDB _id or meetingCode)
    try {
      const meeting = mongoose.Types.ObjectId.isValid(roomId)
        ? await this.meetingRepository.findMeetingById(roomId, workspaceId)
        : await this.meetingRepository.findMeetingByCode(roomId, workspaceId);

      if (meeting) {
        if (workspaceId && meeting.workspaceId.toString() !== workspaceId) {
          return false;
        }

        // Any member in the workspace with the meeting code/id can join
        return true;
      }
    } catch {
      // Not a meeting
    }

    return false;
  }
}
