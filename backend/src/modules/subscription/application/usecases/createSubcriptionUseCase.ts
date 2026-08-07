import { SubscriptionAlreadyExist } from "../../../../common/Errors/SubscriptionError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import { ISubscriptionDocument } from "../../infrastructure/subscriptionSchema";
import { createSubscriptionDTO } from "../dto/subcriptionDTOs";

export class CreateSubscriptionUseCase implements IuseCase<createSubscriptionDTO,void>{
    constructor(
        private readonly subscriptionRepository:IsubscriptionRepository
    ){}
    async execute(data:ISubscriptionDocument){
        const subcription=await this.subscriptionRepository.findSubscription(data.subscriptionName)
        if(subcription){
            throw new SubscriptionAlreadyExist()
        }
        await this.subscriptionRepository.createSubscription(data)
    }
} 