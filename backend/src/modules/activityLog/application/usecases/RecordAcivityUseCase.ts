import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IactivityLogRepository } from "../../domain/IactivitylogRepository";
import { ActivityLogInputDTO } from "../dto/activityLogDTO";



export class RecordActivityLogUseCase implements IuseCase<any,any>{
    constructor(
        private readonly activityLogRepository:IactivityLogRepository
    ){}
    async execute(data: ActivityLogInputDTO): Promise<any> {
        await this.activityLogRepository.recordActivity(data)
    }
}