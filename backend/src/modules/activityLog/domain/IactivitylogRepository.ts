import { ActivityLogInputDTO } from "../application/dto/activityLogDTO";
import { IActivityLogDocumet } from "../infrastructure/activitylogSchema";

export interface ActivityLogQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface EnrichedActivityLog extends Omit<Partial<IActivityLogDocumet>, "_id"> {
  _id: string;
  occurredAt: Date;
  action: string;
  actorId: string | null;
  actorRole?: string;
  actorName?: string;
  actorEmail?: string;
  organizationId?: string;
  organizationName?: string;
  workspaceId?: string;
  workspaceName?: string;
  targetType?: string;
  targetId?: string;
  requestId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface PaginatedActivityLogs {
  logs: EnrichedActivityLog[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IactivityLogRepository{
    recordActivity(data:ActivityLogInputDTO):Promise<void>
    getWorkspaceActivityLogs(workspaceId: string, options: ActivityLogQueryOptions): Promise<PaginatedActivityLogs>
    getOrganizationActivityLogs(organizationId: string, options: ActivityLogQueryOptions): Promise<PaginatedActivityLogs>
    getSystemActivityLogs(options: ActivityLogQueryOptions): Promise<PaginatedActivityLogs>
}
