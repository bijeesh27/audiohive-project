import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IsubscriptionRepository } from "../../domain/IsubscriptionRepository";
import {stripe} from '../../../../config/stripe'

export class CreateCheckoutSessionUseCase implements IuseCase<{ planId: string; ownerEmail?: string }, string> {
  constructor(private readonly subscriptionRepository: IsubscriptionRepository) {}

  async execute({ planId, ownerEmail }: { planId: string; ownerEmail?: string }): Promise<string> {
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
        },
      });

      return session.url;
    } catch (error) {
      console.error("Stripe Session Creation Error:", error);
      throw new Error("Unable to create checkout session");
    }
  }
}
