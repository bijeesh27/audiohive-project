import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IactivityLogRepository } from "../../domain/IactivitylogRepository";
import { ActivityLogInputDTO } from "../dto/activityLogDTO";

export class RecordActivityLogUseCase implements IuseCase<ActivityLogInputDTO, void> {
    constructor(
        private readonly activityLogRepository: IactivityLogRepository
    ) {}

    async execute(data: ActivityLogInputDTO): Promise<void> {
        await this.activityLogRepository.recordActivity(data);
    }
}
