import { IuseCase } from "../../../../shared/interface/IuseCase";
import {
  VerifyUpgradeDTO,
  VerifyUpgradeResponseDTO,
} from "../dto/subcriptionDTOs";
import { OrganizationModel } from "../../../organization/infrastructure/organizationSchema";
import { SubscriptionModel } from "../../infrastructure/subscriptionSchema";
import { stripe } from "../../../../config/stripe";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { HttpStatus } from "../../../../common/constant/httpStatus";
import logger from "../../../../shared/utils/logger";

export class VerifyUpgradeUseCase
  implements IuseCase<VerifyUpgradeDTO, VerifyUpgradeResponseDTO>
{
  constructor(private readonly activityLogRepository: IactivityLogRepository) {}

  async execute({
    ownerEmail,
    sessionId,
  }: VerifyUpgradeDTO): Promise<VerifyUpgradeResponseDTO> {
    const org = await OrganizationModel.findOne({ ownerEmail });
    if (!org) {
      throw new AppError("Organization not found.", HttpStatus.NOT_FOUND);
    }

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      logger.error("Failed to retrieve Stripe session:", error);
      throw new AppError("Failed to verify payment session with Stripe.", HttpStatus.BAD_REQUEST);
    }

    if (session.payment_status !== "paid" && session.status !== "complete") {
      throw new AppError("Payment has not been completed or was declined.", HttpStatus.BAD_REQUEST);
    }

    const { organizationId, targetPlanId, previousPlanId } = session.metadata || {};

    if (!organizationId || organizationId !== org._id.toString()) {
      throw new AppError("This payment session does not match your organization.", HttpStatus.FORBIDDEN);
    }

    if (!targetPlanId) {
      throw new AppError("Invalid session metadata: missing target plan ID.", HttpStatus.BAD_REQUEST);
    }

    const targetPlan = await SubscriptionModel.findById(targetPlanId);
    if (!targetPlan) {
      throw new AppError("Subscribed plan not found.", HttpStatus.NOT_FOUND);
    }

    // Idempotency: If organization already reflects this plan, return immediately
    if (org.planId === targetPlanId) {
      return {
        success: true,
        plan: targetPlan,
        message: `Your subscription to ${targetPlan.subscriptionName} is active.`,
      };
    }

    // Atomic update
    await OrganizationModel.findByIdAndUpdate(
      org._id,
      { planId: targetPlanId },
      { new: true }
    );

    // Record activity log
    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),
      action: "UPGRADE_SUBSCRIPTION",
      actorId: null,
      organizationId: org._id.toString(),
      targetType: "SUBSCRIPTION",
      targetId: targetPlanId,
      metadata: {
        sessionId,
        previousPlanId: previousPlanId || org.planId,
        targetPlanId,
        planName: targetPlan.subscriptionName,
        paymentStatus: session.payment_status,
      },
    });

    return {
      success: true,
      plan: targetPlan,
      message: `Successfully upgraded to ${targetPlan.subscriptionName}!`,
    };
  }
}
