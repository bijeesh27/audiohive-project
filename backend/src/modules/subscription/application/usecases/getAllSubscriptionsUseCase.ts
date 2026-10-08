import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import { ISubscriptionDocument } from "../../infrastructure/subscriptionSchema";

export class GetAllSubscriptionsUseCase implements IuseCase<void,ISubscriptionDocument[]>{
    constructor(
        private readonly subscriptionRepository:IsubscriptionRepository
    ){}

    async execute(){
        return await this.subscriptionRepository.getAllSubscriptions()
    }
}
