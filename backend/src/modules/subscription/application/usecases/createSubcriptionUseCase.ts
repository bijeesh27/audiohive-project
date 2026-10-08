import { MESSAGES } from "../../../../common/constant/messages";
import { SubscriptionAlreadyExist } from "../../../../common/Errors/SubscriptionError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import { ISubscriptionDocument } from "../../infrastructure/subscriptionSchema";
import { CreateSubscriptionDTO } from "../dto/subcriptionDTOs";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class CreateSubscriptionUseCase implements IuseCase<
  CreateSubscriptionDTO,
  void
> {
  constructor(
    private readonly subscriptionRepository: IsubscriptionRepository, private readonly activityLogRepository: IactivityLogRepository
  ) {}
  async execute(data: CreateSubscriptionDTO) {
    const subcription = await this.subscriptionRepository.findSubscription(
      data.subscriptionName,
    );
    if (subcription) {
      throw new SubscriptionAlreadyExist();
    }
    try {
      await this.subscriptionRepository.createSubscription(data as ISubscriptionDocument);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new SubscriptionAlreadyExist(
          MESSAGES.ERRORS.SUBSCRIPTION_PLAN_EXIST,
        );
      }

      throw error;
    }

      await this.activityLogRepository.recordActivity({
            occurredAt: new Date(),
            action: "CREATE_SUBCRIPTION",
            actorId: data ? (data as any).actorId || (data as any).userId || (data as any).uploaderId || null : null,
            organizationId: data ? (data as any).organizationId : undefined,
            workspaceId: data ? (data as any).workspaceId || (data as any).roomId : undefined,
            targetType: "CREATE",
            targetId: undefined,
            metadata: {}
          });
  }
}
