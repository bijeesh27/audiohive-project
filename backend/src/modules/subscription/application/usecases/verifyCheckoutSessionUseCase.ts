import { stripe } from "../../../../config/stripe";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { VerifyCheckoutSessionDTO, VerifyCheckoutSessionResultDTO } from "../dto/subcriptionDTOs";

export class VerifyCheckoutSessionUseCase
  implements IuseCase<VerifyCheckoutSessionDTO, VerifyCheckoutSessionResultDTO>
{
  constructor(private readonly activityLogRepository: IactivityLogRepository) {}

  async execute({ sessionId }: VerifyCheckoutSessionDTO): Promise<VerifyCheckoutSessionResultDTO> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const result: VerifyCheckoutSessionResultDTO = {
        status: session.payment_status,
        ownerEmail: session.metadata?.ownerEmail || "",
        companyName: session.metadata?.companyName || "",
        slug: session.metadata?.slug || "",
        ownerName: session.metadata?.ownerName || "",
        planId: session.metadata?.planId || "",
      };

      await this.activityLogRepository.recordActivity({
        occurredAt: new Date(),
        action: "VERIFY_CHECKOUT_SESSION",
        actorId: null,
        targetType: "SUBSCRIPTION",
        targetId: sessionId,
        metadata: { status: result.status, ownerEmail: result.ownerEmail },
      });

      return result;
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
