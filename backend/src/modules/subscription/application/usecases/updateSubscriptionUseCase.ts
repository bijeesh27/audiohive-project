import { MESSAGES } from "../../../../common/constant/messages";
import { UpdateSubscriptionError } from "../../../../common/Errors/SubscriptionError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import { UpdateSubscriptionDTO } from "../dto/subcriptionDTOs";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class UpdateSubscriptionUseCase implements IuseCase<UpdateSubscriptionDTO,void> {
    constructor(
        private readonly subscrptionRepository:IsubscriptionRepository, private readonly activityLogRepository: IactivityLogRepository
    ){}
    async execute(data: UpdateSubscriptionDTO):Promise<void>{
        if(!data.id){
            throw new UpdateSubscriptionError(MESSAGES.ERRORS.SUBSCRIPTION_ID_NOT_FOUND)
        }
        const subscription=await this.subscrptionRepository.findSubscriptionById(data.id)
        if(!subscription){
            throw new UpdateSubscriptionError(MESSAGES.ERRORS.SUBSCRIPTION_NOT_FOUND)
        }
        try {
            const { id, ...updateData } = data;
            await this.subscrptionRepository.updateSubscription(id, updateData)
        } catch (error: unknown) {
            const err = error as { code?: number; keyPattern?: { subscriptionName?: number } };
            if (err.code === 11000 && err.keyPattern && err.keyPattern.subscriptionName) {
                throw new UpdateSubscriptionError(MESSAGES.ERRORS.SUBSCRIPTION_PLAN_EXIST);
            }
            throw error;
        }

        await this.activityLogRepository.recordActivity({
              occurredAt: new Date(),
              action: "UPDATE_SUBSCRIPTION",
              actorId: data ? (data as any).actorId || (data as any).userId || (data as any).uploaderId || null : null,
              organizationId: data ? (data as any).organizationId : undefined,
              workspaceId: data ? (data as any).workspaceId || (data as any).roomId : undefined,
              targetType: "UPDATE",
              targetId: undefined,
              metadata: {}
            });
    }
}
