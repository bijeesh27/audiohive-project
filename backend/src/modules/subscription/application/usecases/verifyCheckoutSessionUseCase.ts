import { stripe } from "../../../../config/stripe";
import { IuseCase } from "../../../../shared/interface/IuseCase";

export interface VerifySessionResult {
  status: string;
  ownerEmail: string;
  companyName: string;
  slug: string;
  ownerName: string;
  planId: string;
}

export class VerifyCheckoutSessionUseCase implements IuseCase<string, VerifySessionResult> {
  async execute(sessionId: string): Promise<VerifySessionResult> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return {
        status: session.payment_status,
        ownerEmail: session.metadata?.ownerEmail || "",
        companyName: session.metadata?.companyName || "",
        slug: session.metadata?.slug || "",
        ownerName: session.metadata?.ownerName || "",
        planId: session.metadata?.planId || "",
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new Error(
        `Failed to verify checkout session: ${errorMessage}`,
        { cause: error }
      );
    }
  }
}
