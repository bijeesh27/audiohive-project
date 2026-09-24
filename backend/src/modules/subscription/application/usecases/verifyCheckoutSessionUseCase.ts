import { stripe } from "../../../../config/stripe";
import { IuseCase } from "../../../../shared/interface/IuseCase";

export class VerifyCheckoutSessionUseCase implements IuseCase<string, { status: string; ownerEmail: string }> {
  async execute(sessionId: string): Promise<{ status: string; ownerEmail: string }> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return {
        status: session.payment_status,
        ownerEmail: session.metadata?.ownerEmail || ""
      };
    } catch (error: any) {
      throw new Error(`Failed to verify checkout session: ${error.message}`);
    }
  }
}
