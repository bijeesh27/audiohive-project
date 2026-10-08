import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import {stripe} from '../../../../config/stripe'
import logger from "../../../../shared/utils/logger";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { CreateCheckoutSessionDTO } from "../dto/subcriptionDTOs";

export class CreateCheckoutSessionUseCase implements IuseCase<CreateCheckoutSessionDTO, string> {
  constructor(private readonly subscriptionRepository: IsubscriptionRepository, private readonly activityLogRepository: IactivityLogRepository) {}

  async execute({ planId, ownerEmail, companyName, slug, ownerName }: CreateCheckoutSessionDTO): Promise<string> {
    const plan = await this.subscriptionRepository.findSubscriptionById(planId);

    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    if (!plan.stripePriceId) {
      throw new Error("Stripe price is not configured for this plan");
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
        throw new Error("Stripe did not return a checkout URL");
      }
      return session.url;
    } catch (error) {
      logger.error("Stripe Session Creation Error:", error);
      throw new Error("Unable to create checkout session", { cause: error });
    }

      await this.activityLogRepository.recordActivity({
            occurredAt: new Date(),
            action: "CREATE_CHECKOUT_SESSION",
            actorId: { planId, ownerEmail, companyName, slug, ownerName } ? ({ planId, ownerEmail, companyName, slug, ownerName } as any).actorId || ({ planId, ownerEmail, companyName, slug, ownerName } as any).userId || ({ planId, ownerEmail, companyName, slug, ownerName } as any).uploaderId || null : null,
            organizationId: { planId, ownerEmail, companyName, slug, ownerName } ? ({ planId, ownerEmail, companyName, slug, ownerName } as any).organizationId : undefined,
            workspaceId: { planId, ownerEmail, companyName, slug, ownerName } ? ({ planId, ownerEmail, companyName, slug, ownerName } as any).workspaceId || ({ planId, ownerEmail, companyName, slug, ownerName } as any).roomId : undefined,
            targetType: "CREATE",
            targetId: undefined,
            metadata: {}
          });
  }
}
