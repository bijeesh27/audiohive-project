import { IuseCase } from "../../../../shared/interface/IuseCase";
import { ActivityLogQueryOptions } from "../../domain/IactivitylogRepository";
import { IactivityLogRepository } from "../../domain/IactivitylogRepository";

export class GetSystemActivityLogsUseCase implements IuseCase<ActivityLogQueryOptions, any> {
    constructor(
        private readonly activityLogRepository: IactivityLogRepository
    ) {}

    async execute(params: ActivityLogQueryOptions): Promise<any> {
        const { page, limit, search } = params;
        return this.activityLogRepository.getSystemActivityLogs({ page, limit, search });
    }
}
