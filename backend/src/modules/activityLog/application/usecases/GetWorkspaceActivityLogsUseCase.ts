import { IuseCase } from "../../../../shared/interface/IuseCase";
import { ActivityLogQueryOptions, IactivityLogRepository, PaginatedActivityLogs } from "../../domain/IactivitylogRepository";

export class GetWorkspaceActivityLogsUseCase implements IuseCase<{ workspaceId: string } & ActivityLogQueryOptions, PaginatedActivityLogs> {
    constructor(
        private readonly activityLogRepository: IactivityLogRepository
    ) {}

    async execute(params: { workspaceId: string } & ActivityLogQueryOptions): Promise<PaginatedActivityLogs> {
        const { workspaceId, page, limit, search } = params;
        return this.activityLogRepository.getWorkspaceActivityLogs(workspaceId, { page, limit, search });
    }
}
