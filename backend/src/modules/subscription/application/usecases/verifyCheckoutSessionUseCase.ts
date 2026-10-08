import { stripe } from "../../../../config/stripe";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { VerifyCheckoutSessionDTO, VerifyCheckoutSessionResultDTO } from "../dto/subcriptionDTOs";

export class VerifyCheckoutSessionUseCase implements IuseCase<VerifyCheckoutSessionDTO, VerifyCheckoutSessionResultDTO> {
  async execute({ sessionId }: VerifyCheckoutSessionDTO): Promise<VerifyCheckoutSessionResultDTO> {
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

      await this.activityLogRepository.recordActivity({
            occurredAt: new Date(),
            action: "VERIFY_CHECKOUT_SESSION",
            actorId: sessionId ? (sessionId as any).actorId || (sessionId as any).userId || (sessionId as any).uploaderId || null : null,
            organizationId: sessionId ? (sessionId as any).organizationId : undefined,
            workspaceId: sessionId ? (sessionId as any).workspaceId || (sessionId as any).roomId : undefined,
            targetType: "VERIFY",
            targetId: undefined,
            metadata: {}
          });
  }

    constructor(private readonly activityLogRepository: IactivityLogRepository) {
    }
}
