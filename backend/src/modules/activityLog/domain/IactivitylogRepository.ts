import { IActivityLogDocumet } from "../infrastructure/activitylogSchema";


export interface IactivityLogRepository{
    recordActivity(data:IActivityLogDocumet):Promise<void>
}