import { Types } from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import {
  UpgradeSubscriptionDTO,
  UpgradeSubscriptionResponseDTO,
} from "../dto/subcriptionDTOs";
import { OrganizationModel } from "../../../organization/infrastructure/organizationSchema";
import { WorkspaceModel } from "../../../workspace/infrastructure/workspaceSchema";
import { SubscriptionModel } from "../../infrastructure/subscriptionSchema";
import { stripe } from "../../../../config/stripe";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { HttpStatus } from "../../../../common/constant/httpStatus";
import { MESSAGES } from "../../../../common/constant/messages";
import logger from "../../../../shared/utils/logger";

export class UpgradeSubscriptionUseCase
  implements IuseCase<UpgradeSubscriptionDTO, UpgradeSubscriptionResponseDTO>
{
  constructor(private readonly activityLogRepository: IactivityLogRepository) {}

  async execute({
    ownerEmail,
    targetPlanId,
  }: UpgradeSubscriptionDTO): Promise<UpgradeSubscriptionResponseDTO> {
    const org = await OrganizationModel.findOne({ ownerEmail });
    if (!org) {
      throw new AppError(MESSAGES.ERRORS.ORANIZATION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (!Types.ObjectId.isValid(targetPlanId)) {
      throw new AppError("Invalid plan ID provided", HttpStatus.BAD_REQUEST);
    }

    const targetPlan = await SubscriptionModel.findById(targetPlanId);
    if (!targetPlan || !targetPlan.isActive) {
      throw new AppError(MESSAGES.ERRORS.SUBSCRIPTION_PLAN_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Check if user is already on this plan
    if (org.planId === targetPlan._id.toString()) {
      throw new AppError("Your organization is already on this plan.", HttpStatus.BAD_REQUEST);
    }

    // Check current usage against target plan limits
    const currentWorkspacesCount = await WorkspaceModel.countDocuments({
      organizationId: org._id,
    });

    if (currentWorkspacesCount > targetPlan.maxWorkspaces) {
      throw new AppError(
        `Cannot switch to ${targetPlan.subscriptionName}. You have ${currentWorkspacesCount} workspaces, but the ${targetPlan.subscriptionName} plan allows a maximum of ${targetPlan.maxWorkspaces}. Please remove or archive extra workspaces before switching.`,
        HttpStatus.BAD_REQUEST
      );
    }

    // If target plan is Free (0 price), perform atomic switch directly
    if (targetPlan.price === 0) {
      const prevPlanId = org.planId;
      await OrganizationModel.findByIdAndUpdate(
        org._id,
        { planId: targetPlan._id.toString() },
        { new: true }
      );

      await this.activityLogRepository.recordActivity({
        occurredAt: new Date(),
        action: "CHANGE_SUBSCRIPTION",
        actorId: null,
        organizationId: org._id.toString(),
        targetType: "SUBSCRIPTION",
        targetId: targetPlan._id.toString(),
        metadata: {
          ownerEmail: org.ownerEmail,
          previousPlanId: prevPlanId,
          targetPlanId: targetPlan._id.toString(),
          targetPlanName: targetPlan.subscriptionName,
        },
      });

      return {
        directUpdate: true,
        plan: targetPlan,
        message: `Plan changed to ${targetPlan.subscriptionName} successfully.`,
      };
    }

    // Paid Plan: Requires Stripe Checkout
    if (!targetPlan.stripePriceId) {
      throw new AppError(
        MESSAGES.ERRORS.STRIPE_PRICE_NOT_CONFIGURED || "Stripe price is not configured for this plan.",
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: targetPlan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: `${clientUrl}/organization-owner/subscription?session_id={CHECKOUT_SESSION_ID}&upgrade_status=success`,
        cancel_url: `${clientUrl}/organization-owner/subscription?upgrade_status=cancelled`,
        metadata: {
          organizationId: org._id.toString(),
          targetPlanId: targetPlan._id.toString(),
          previousPlanId: org.planId || "free",
          ownerEmail: org.ownerEmail,
          isUpgrade: "true",
        },
      });

      if (!session.url) {
        throw new AppError(
          MESSAGES.ERRORS.STRIPE_NO_CHECKOUT_URL || "Unable to generate checkout URL.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      await this.activityLogRepository.recordActivity({
        occurredAt: new Date(),
        action: "CREATE_UPGRADE_SESSION",
        actorId: null,
        organizationId: org._id.toString(),
        targetType: "SUBSCRIPTION",
        targetId: targetPlan._id.toString(),
        metadata: {
          sessionId: session.id,
          targetPlanId: targetPlan._id.toString(),
          ownerEmail: org.ownerEmail,
        },
      });

      return {
        directUpdate: false,
        checkoutUrl: session.url,
      };
    } catch (err) {
      logger.error("Stripe Upgrade Session Error:", err);
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to initiate upgrade payment session.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
