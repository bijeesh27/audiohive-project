import { Types } from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { MESSAGES } from "../../../../common/constant/messages";
import { ActivityLogModel } from "../../../activityLog/infrastructure/activitylogSchema";
import { UserModel } from "../../../../shared/User.utils/userSchema";

export interface GetWorkspaceActivitiesInput {
  workspaceId: string;
  ownerEmail: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface WorkspaceActivityItemDTO {
  _id: string;
  action: string;
  actorId: string | null;
  actorName: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface GetWorkspaceActivitiesOutput {
  activities: WorkspaceActivityItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GetWorkspaceActivitiesUseCase implements IuseCase<GetWorkspaceActivitiesInput, GetWorkspaceActivitiesOutput> {
  constructor(
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly organizationRepository: IorganizaionRepository
  ) {}

  async execute(input: GetWorkspaceActivitiesInput): Promise<GetWorkspaceActivitiesOutput> {
    const { workspaceId, ownerEmail, page = 1, limit = 10, search } = input;

    const [organization, workspace] = await Promise.all([
      this.organizationRepository.findByOwnerEmail(ownerEmail),
      this.workspaceRepository.getWorkspaceById(workspaceId),
    ]);

    if (!organization || !workspace || workspace.organizationId.toString() !== organization._id.toString()) {
      throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, 403);
    }

    const wsIdStr = workspace._id.toString();
    const query: Record<string, unknown> = {
      workspaceId: { $in: [wsIdStr, workspace._id] },
    };

    if (search && search.trim()) {
      query.action = { $regex: search.trim(), $options: "i" };
    }

    const [rawLogs, total] = await Promise.all([
      ActivityLogModel.find(query)
        .sort({ occurredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ActivityLogModel.countDocuments(query),
    ]);

    const actorIds = rawLogs.map((l) => l.actorId).filter(Boolean) as string[];
    const actorUsers = actorIds.length > 0
      ? await UserModel.find({ _id: { $in: actorIds } }).select("_id username email").lean()
      : [];
    const actorMap = new Map(actorUsers.map((u) => [u._id.toString(), u.username]));

    const activities: WorkspaceActivityItemDTO[] = rawLogs.map((log) => ({
      _id: log._id.toString(),
      action: log.action,
      actorId: log.actorId || null,
      actorName: (log.actorId && actorMap.get(log.actorId.toString())) || log.actorRole || "System",
      actorRole: log.actorRole,
      targetType: log.targetType,
      targetId: log.targetId,
      occurredAt: log.occurredAt ? new Date(log.occurredAt).toISOString() : new Date().toISOString(),
      metadata: log.metadata as Record<string, unknown> | undefined,
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      activities,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
