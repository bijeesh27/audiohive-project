import { IuseCase } from "../../../../shared/interface/IuseCase";
import { ActivityLogQueryOptions } from "../../domain/IactivitylogRepository";
import { IactivityLogRepository } from "../../domain/IactivitylogRepository";

export class GetWorkspaceActivityLogsUseCase implements IuseCase<{ workspaceId: string } & ActivityLogQueryOptions, any> {
    constructor(
        private readonly activityLogRepository: IactivityLogRepository
    ) {}

    async execute(params: { workspaceId: string } & ActivityLogQueryOptions): Promise<any> {
        const { workspaceId, page, limit, search } = params;
        return this.activityLogRepository.getWorkspaceActivityLogs(workspaceId, { page, limit, search });
    }
}
