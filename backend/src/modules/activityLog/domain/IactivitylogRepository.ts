import { ActivityLogInputDTO } from "../application/dto/activityLogDTO";
import { IActivityLogDocumet } from "../infrastructure/activitylogSchema";


export interface IactivityLogRepository{
    recordActivity(data:ActivityLogInputDTO):Promise<void>
}