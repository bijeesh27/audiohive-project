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
            throw new UpdateSubscriptionError("Subscription ID is required.")
        }
        const subscription=await this.subscrptionRepository.findSubscriptionById(data.id)
        if(!subscription){
            throw new UpdateSubscriptionError(MESSAGES.ERRORS.SUBSCRIPTION_NOT_FOUND)
        }
        await this.subscrptionRepository.updateSubscription(subscription._id.toString(),data)
    }
}