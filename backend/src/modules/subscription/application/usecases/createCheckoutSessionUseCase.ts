import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import {stripe} from '../../../../config/stripe'
import logger from "../../../../shared/utils/logger";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { CreateCheckoutSessionDTO } from "../dto/subcriptionDTOs";
import { MESSAGES } from "../../../../common/constant/messages";

export class CreateCheckoutSessionUseCase implements IuseCase<CreateCheckoutSessionDTO, string> {
  constructor(private readonly subscriptionRepository: IsubscriptionRepository, private readonly activityLogRepository: IactivityLogRepository) {}

  async execute({ planId, ownerEmail, companyName, slug, ownerName }: CreateCheckoutSessionDTO): Promise<string> {
    const plan = await this.subscriptionRepository.findSubscriptionById(planId);

    if (!plan) {
      throw new Error(MESSAGES.ERRORS.SUBSCRIPTION_PLAN_NOT_FOUND);
    }

    if (!plan.stripePriceId) {
      throw new Error(MESSAGES.ERRORS.STRIPE_PRICE_NOT_CONFIGURED);
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
        metadata: {
          planId: plan._id.toString(),
          ownerEmail: ownerEmail || "",
          companyName: companyName || "",
          slug: slug || "",
          ownerName: ownerName || "",
        },
      });

      if (!session.url) {
        throw new Error(MESSAGES.ERRORS.STRIPE_NO_CHECKOUT_URL);
      }

      await this.activityLogRepository.recordActivity({
        occurredAt: new Date(),
        action: "CREATE_CHECKOUT_SESSION",
        actorId: null,
        targetType: "SUBSCRIPTION",
        targetId: planId,
        metadata: {
          ownerEmail: ownerEmail || null,
          companyName: companyName || null,
          slug: slug || null,
          ownerName: ownerName || null,
        },
      });

      return session.url;
    } catch (error) {
      logger.error("Stripe Session Creation Error:", error);
      throw new Error(MESSAGES.ERRORS.UNABLE_TO_CREATE_CHECKOUT, { cause: error });
    }
  }
}
