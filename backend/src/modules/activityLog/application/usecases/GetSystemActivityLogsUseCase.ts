import { IuseCase } from "../../../../shared/interface/IuseCase";
import { ActivityLogQueryOptions, IactivityLogRepository, PaginatedActivityLogs } from "../../domain/IactivitylogRepository";

export class GetSystemActivityLogsUseCase implements IuseCase<ActivityLogQueryOptions, PaginatedActivityLogs> {
    constructor(
        private readonly activityLogRepository: IactivityLogRepository
    ) {}

    async execute(params: ActivityLogQueryOptions): Promise<PaginatedActivityLogs> {
        return this.activityLogRepository.getSystemActivityLogs(params);
    }
}
