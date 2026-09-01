import { MESSAGES } from "../../../../common/constant/messages";
import { UpdateSubscriptionError } from "../../../../common/Errors/SubscriptionError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import { updateSubscriptionDTO } from "../dto/subcriptionDTOs";

export class UpdateSubscriptionUseCase implements IuseCase<updateSubscriptionDTO,void> {
    constructor(
        private readonly subscrptionRepository:IsubscriptionRepository
    ){}
    async execute(data:updateSubscriptionDTO):Promise<void>{
        if(!data.id){
            throw new UpdateSubscriptionError(MESSAGES.ERRORS.SUBSCRIPTION_ID_NOT_FOUND)
        }
        const subscription=await this.subscrptionRepository.findSubscriptionById(data.id)
        if(!subscription){
            throw new UpdateSubscriptionError(MESSAGES.ERRORS.SUBSCRIPTION_NOT_FOUND)
        }
        try {
            await this.subscrptionRepository.updateSubscription(subscription._id.toString(),data)
        } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.subscriptionName) {
                throw new UpdateSubscriptionError(MESSAGES.ERRORS.SUBSCRIPTION_PLAN_EXIST);
            }
            throw error;
        }
    }
}