import { MESSAGES } from "../../../../common/constant/messages";
import { DeleteSubcriptionError } from "../../../../common/Errors/SubscriptionError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import { deleteSubscriptionDTO } from "../dto/subcriptionDTOs";

export class DeleteSubcriptionUseCase implements IuseCase<deleteSubscriptionDTO,void>{
  constructor(
    private readonly subscriptionRepository:IsubscriptionRepository
  ){}
  async execute(data:deleteSubscriptionDTO): Promise<void> {
    const deletedSubcription=await this.subscriptionRepository.findSubscription(data.id)
    if(!deletedSubcription){
      throw new DeleteSubcriptionError(MESSAGES.ERRORS.SUBSCRIPTION_NOT_FOUND)
    }
      await this.subscriptionRepository.deleteSubscription(data.id)
  }
}