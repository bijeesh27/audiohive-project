import { IuseCase } from "../../../../shared/interface/IuseCase";
import { ActivityLogQueryOptions, IactivityLogRepository, PaginatedActivityLogs } from "../../domain/IactivitylogRepository";

export class GetOrganizationActivityLogsUseCase implements IuseCase<{ organizationId: string } & ActivityLogQueryOptions, PaginatedActivityLogs> {
    constructor(
        private readonly activityLogRepository: IactivityLogRepository
    ) {}

    async execute(params: { organizationId: string } & ActivityLogQueryOptions): Promise<PaginatedActivityLogs> {
        const { organizationId, page, limit, search } = params;
        return this.activityLogRepository.getOrganizationActivityLogs(organizationId, { page, limit, search });
    }
}
