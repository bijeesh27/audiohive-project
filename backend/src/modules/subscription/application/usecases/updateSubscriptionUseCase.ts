import { MESSAGES } from "../../../../common/constant/messages";
import { UpdateSubscriptionError } from "../../../../common/Errors/SubscriptionError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import { ISubscriptionDocument } from "../../infrastructure/subscriptionSchema";
import { updateSubscriptionDTO } from "../dto/subcriptionDTOs";

export class UpdateSubscriptionUseCase implements IuseCase<updateSubscriptionDTO,void> {
    constructor(
        private readonly subscrptionRepository:IsubscriptionRepository
    ){}
    async execute(data:updateSubscriptionDTO):Promise<void>{
        if(!data.subscriptionName){
            throw new UpdateSubscriptionError(MESSAGES.ERRORS.SUBCRIPTION_NAME_UNDEFINED)
        }
        const subscription=await this.subscrptionRepository.findSubscription(data.subscriptionName)
        if(!subscription){
            throw new UpdateSubscriptionError(MESSAGES.ERRORS.SUBSCRIPTION_NOT_FOUND)
        }
        await this.subscrptionRepository.updateSubscription(subscription._id.toString(),data)
    }
}