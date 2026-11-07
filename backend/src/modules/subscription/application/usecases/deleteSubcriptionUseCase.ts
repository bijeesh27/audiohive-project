import { MESSAGES } from "../../../../common/constant/messages";
import { DeleteSubcriptionError } from "../../../../common/Errors/SubscriptionError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import { DeleteSubscriptionDTO } from "../dto/subcriptionDTOs";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class DeleteSubcriptionUseCase implements IuseCase<DeleteSubscriptionDTO,void>{
  constructor(
    private readonly subscriptionRepository:IsubscriptionRepository, private readonly activityLogRepository: IactivityLogRepository
  ){}
  async execute(data: DeleteSubscriptionDTO): Promise<void> {
    if(!data.id){
      throw new DeleteSubcriptionError(MESSAGES.ERRORS.SUBSCRIPTION_ID_NOT_FOUND)
    }
    const deletedSubcription=await this.subscriptionRepository.findSubscriptionById(data.id)
    if(!deletedSubcription){
      throw new DeleteSubcriptionError(MESSAGES.ERRORS.SUBSCRIPTION_NOT_FOUND)
    }
      await this.subscriptionRepository.deleteSubscription(data.id)

      await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "DELETE_SUBSCRIPTION",
      actorId: null,
      targetType: "SUBSCRIPTION",
      targetId: data.id,
      metadata: {},
    });
  }
}
