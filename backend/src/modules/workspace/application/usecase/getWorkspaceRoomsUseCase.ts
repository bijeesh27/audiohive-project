import { Types } from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { MESSAGES } from "../../../../common/constant/messages";
import { RoomModel } from "../../../room/infrastructure/roomSchema";
import { UserModel } from "../../../../shared/User.utils/userSchema";
import { socketService } from "../../../../socket/socketService";
import { WORKSPACE_MEMBER_ROLES } from "../../../../shared/User.utils/workspaceMembership";
import { buildMultiWorkspaceMembershipQuery } from "../../../../shared/metrics/sharedMetricsService";
import { ActivityLogModel } from "../../../activityLog/infrastructure/activitylogSchema";

export interface GetWorkspaceRoomsInput {
  workspaceId: string;
  ownerEmail: string;
}

export interface WorkspaceRoomItemDTO {
  _id: string;
  name: string;
  type: "standard" | "lounge" | "public" | "private";
  status: "active" | "blocked";
  isDefault: boolean;
  membersCount: number;
  onlineNow: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class GetWorkspaceRoomsUseCase implements IuseCase<GetWorkspaceRoomsInput, WorkspaceRoomItemDTO[]> {
  constructor(
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly organizationRepository: IorganizaionRepository
  ) {}

  async execute(input: GetWorkspaceRoomsInput): Promise<WorkspaceRoomItemDTO[]> {
    const { workspaceId, ownerEmail } = input;

    const [organization, workspace] = await Promise.all([
      this.organizationRepository.findByOwnerEmail(ownerEmail),
      this.workspaceRepository.getWorkspaceById(workspaceId),
    ]);

    if (!organization || !workspace || workspace.organizationId.toString() !== organization._id.toString()) {
      throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, 403);
    }

    const wsIdStr = workspace._id.toString();
    const wsIdObj = Types.ObjectId.isValid(wsIdStr) ? new Types.ObjectId(wsIdStr) : workspace._id;
    const wsIds = [wsIdStr, wsIdObj];

    // Total workspace members count for public/lounge rooms
    const totalWorkspaceMembers = await UserModel.countDocuments({
      role: { $in: WORKSPACE_MEMBER_ROLES },
      ...buildMultiWorkspaceMembershipQuery([workspace._id]),
    });

    const rooms = await RoomModel.find({
      workspaceId: { $in: wsIds },
    })
      .sort({ isDefault: -1, createdAt: 1 })
      .lean();

    const roomIds = rooms.map((r) => r._id.toString());
    const latestLogs = await ActivityLogModel.find({
      $or: [
        { targetId: { $in: roomIds } },
        { "metadata.roomId": { $in: roomIds } },
      ],
    })
      .sort({ occurredAt: -1 })
      .select("targetId metadata.roomId occurredAt")
      .lean();

    const roomActivityMap = new Map<string, Date>();
    for (const log of latestLogs) {
      const targetId = log.targetId?.toString() || (log.metadata as { roomId?: unknown } | undefined)?.roomId?.toString();
      if (targetId && !roomActivityMap.has(targetId)) {
        roomActivityMap.set(targetId, new Date(log.occurredAt));
      }
    }

    return rooms.map((r) => {
      const rId = r._id.toString();
      const isDefault = Boolean(r.isDefault || r.name === "Lounge" || r.name === "Office Common Room");

      let membersCount = totalWorkspaceMembers;
      if (r.type === "private" && !isDefault) {
        membersCount = Array.isArray(r.allowedUsers) ? r.allowedUsers.length : 0;
      }

      const liveParticipants = socketService.getRoomLiveParticipants(rId);
      const onlineNow = liveParticipants.length;

      const lastActivityDate = roomActivityMap.get(rId);
      const lastActivityAt = lastActivityDate
        ? lastActivityDate.toISOString()
        : r.updatedAt
        ? new Date(r.updatedAt).toISOString()
        : r.createdAt
        ? new Date(r.createdAt).toISOString()
        : null;

      return {
        _id: rId,
        name: r.name,
        type: (r.type as "standard" | "lounge" | "public" | "private") || "standard",
        status: (r.status as "active" | "blocked") || "active",
        isDefault,
        membersCount,
        onlineNow,
        lastActivityAt,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      };
    });
  }
}
