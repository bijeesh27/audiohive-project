import { BaseRepository } from "../../../shared/common/baseRepository";
import { IactivityLogRepository } from "../domain/IactivitylogRepository";
import { ActivityLogModel, IActivityLogDocumet } from "./activitylogSchema";


export class ActivityLogRepository extends BaseRepository<IActivityLogDocumet> implements IactivityLogRepository{
    constructor(
    ){
        super(ActivityLogModel)
    }
    async recordActivity(data:IActivityLogDocumet): Promise<void> {
        await this.model.create(data)
    }
}