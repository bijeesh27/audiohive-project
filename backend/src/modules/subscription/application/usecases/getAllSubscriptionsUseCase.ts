import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import { ISubscriptionDocument } from "../../infrastructure/subscriptionSchema";
import { AllSubscriptionsDTO } from "../dto/subcriptionDTOs";

export class GetAllSubscriptionsUseCase implements IuseCase<AllSubscriptionsDTO,ISubscriptionDocument[]>{
    constructor(
        private readonly subscriptionRepository:IsubscriptionRepository
    ){}

    async execute(){
        return await this.subscriptionRepository.getAllSubscriptions()
    }
}