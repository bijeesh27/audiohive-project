import { IuseCase } from "../../../../shared/interface/IuseCase";
import { ActivityLogQueryOptions } from "../../domain/IactivitylogRepository";
import { IactivityLogRepository } from "../../domain/IactivitylogRepository";

export class GetOrganizationActivityLogsUseCase implements IuseCase<{ organizationId: string } & ActivityLogQueryOptions, any> {
    constructor(
        private readonly activityLogRepository: IactivityLogRepository
    ) {}

    async execute(params: { organizationId: string } & ActivityLogQueryOptions): Promise<any> {
        const { organizationId, page, limit, search } = params;
        return this.activityLogRepository.getOrganizationActivityLogs(organizationId, { page, limit, search });
    }
}
