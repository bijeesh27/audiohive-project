import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import {stripe} from '../../../../config/stripe'
import logger from "../../../../shared/utils/logger";

export interface CheckoutSessionInput {
  planId: string;
  ownerEmail?: string;
  companyName?: string;
  slug?: string;
  ownerName?: string;
}

export class CreateCheckoutSessionUseCase implements IuseCase<CheckoutSessionInput, string> {
  constructor(private readonly subscriptionRepository: IsubscriptionRepository) {}

  async execute({ planId, ownerEmail, companyName, slug, ownerName }: CheckoutSessionInput): Promise<string> {
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
  }
}
