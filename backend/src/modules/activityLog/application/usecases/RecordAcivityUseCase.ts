import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IactivityLogRepository } from "../../domain/IactivitylogRepository";



export class RecordActivityLogUseCase implements IuseCase<any,any>{
    constructor(
        private readonly activityLogRepository:IactivityLogRepository
    ){}
    async execute(data: any): Promise<any> {
        await this.activityLogRepository.recordActivity(data)
    }
}