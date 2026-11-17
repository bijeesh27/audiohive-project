import { NextFunction, Request, Response } from "express";
import { IuseCase } from "../../../shared/interface/IuseCase";
import {
  CreateCheckoutSessionDTO,
  CreateSubscriptionDTO,
  DeleteSubscriptionDTO,
  UpdateSubscriptionDTO,
  VerifyCheckoutSessionDTO,
  VerifyCheckoutSessionResultDTO,
  MySubscriptionResponseDTO,
  UpgradeSubscriptionDTO,
  UpgradeSubscriptionResponseDTO,
  VerifyUpgradeDTO,
  VerifyUpgradeResponseDTO,
} from "../application/dto/subcriptionDTOs";
import { ISubscriptionDocument } from "../infrastructure/subscriptionSchema";
import { ApiResposne } from "../../../common/Response/Response";
import { MESSAGES } from "../../../common/constant/messages";
import { HttpStatus } from "../../../common/constant/httpStatus";
import { AppError } from "../../../common/Errors/AppError";
import { AuthRequest } from "../../../middleware/authMiddleware";

export class AuthController {
  constructor(
    private readonly createSubscriptionUseCase: IuseCase<CreateSubscriptionDTO, void>,
    private readonly updateSubscriptionUseCase: IuseCase<UpdateSubscriptionDTO, void>,
    private readonly deleteSubscriptionUseCase: IuseCase<DeleteSubscriptionDTO, void>,
    private readonly getAllSubscriptionUseCase: IuseCase<void, ISubscriptionDocument[]>,
    private readonly createCheckoutSessionUseCase: IuseCase<CreateCheckoutSessionDTO, string>,
    private readonly verifyCheckoutSessionUseCase: IuseCase<VerifyCheckoutSessionDTO, VerifyCheckoutSessionResultDTO>,
    private readonly getMySubscriptionUseCase?: IuseCase<{ ownerEmail: string }, MySubscriptionResponseDTO>,
    private readonly upgradeSubscriptionUseCase?: IuseCase<UpgradeSubscriptionDTO, UpgradeSubscriptionResponseDTO>,
    private readonly verifyUpgradeUseCase?: IuseCase<VerifyUpgradeDTO, VerifyUpgradeResponseDTO>
  ) {}

  async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId, ownerEmail, companyName, slug, ownerName } = req.body;
      if (!planId) {
        throw new AppError(MESSAGES.ERRORS.PLAN_ID_REQUIRED, HttpStatus.BAD_REQUEST);
      }
      const sessionUrl = await this.createCheckoutSessionUseCase.execute({
        planId,
        ownerEmail,
        companyName,
        slug,
        ownerName,
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.CHECKOUT_SESSION_CREATED, { url: sessionUrl });
    } catch (error: unknown) {
      next(error);
    }
  }

  async verifyCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        throw new AppError(MESSAGES.ERRORS.SESSION_ID_REQUIRED, HttpStatus.BAD_REQUEST);
      }
      const data = await this.verifyCheckoutSessionUseCase.execute({ sessionId });
      return ApiResposne.success(res, MESSAGES.SUCCESS.CHECKOUT_SESSION_VERIFIED, data);
    } catch (error: unknown) {
      next(error);
    }
  }

  async getMySubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerEmail = req.user?.userEmail;
      if (!ownerEmail || !this.getMySubscriptionUseCase) {
        throw new AppError("Unauthorized access or service unavailable", HttpStatus.UNAUTHORIZED);
      }
      const data = await this.getMySubscriptionUseCase.execute({ ownerEmail });
      return ApiResposne.success(res, "Subscription details retrieved successfully", data);
    } catch (error: unknown) {
      next(error);
    }
  }

  async upgradeSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerEmail = req.user?.userEmail;
      const { targetPlanId } = req.body;
      if (!ownerEmail || !this.upgradeSubscriptionUseCase) {
        throw new AppError("Unauthorized access or service unavailable", HttpStatus.UNAUTHORIZED);
      }
      if (!targetPlanId) {
        throw new AppError("Target plan ID is required", HttpStatus.BAD_REQUEST);
      }
      const result = await this.upgradeSubscriptionUseCase.execute({ ownerEmail, targetPlanId });
      return ApiResposne.success(res, result.message || "Upgrade initiated", result);
    } catch (error: unknown) {
      next(error);
    }
  }

  async verifyUpgrade(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerEmail = req.user?.userEmail;
      const { sessionId } = req.body;
      if (!ownerEmail || !this.verifyUpgradeUseCase) {
        throw new AppError("Unauthorized access or service unavailable", HttpStatus.UNAUTHORIZED);
      }
      if (!sessionId) {
        throw new AppError("Session ID is required", HttpStatus.BAD_REQUEST);
      }
      const result = await this.verifyUpgradeUseCase.execute({ ownerEmail, sessionId });
      return ApiResposne.success(res, result.message || "Upgrade verified successfully", result);
    } catch (error: unknown) {
      next(error);
    }
  }

  async createSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.createSubscriptionUseCase.execute(req.body);
      return ApiResposne.success(res, MESSAGES.SUCCESS.SUBSCRIPTION_CREATED, response, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const payload: UpdateSubscriptionDTO = {
        id: req.body.subscriptionId,
        ...req.body.data,
      };
      const updatedSubscription = await this.updateSubscriptionUseCase.execute(payload);
      return ApiResposne.success(res, MESSAGES.SUCCESS.SUBSCRIPTION_UPDATED, updatedSubscription);
    } catch (error) {
      next(error);
    }
  }

  async deleteSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const deletedsubscription = await this.deleteSubscriptionUseCase.execute(req.body);
      return ApiResposne.success(res, MESSAGES.SUCCESS.SUBSCRIPTION_DELETED, deletedsubscription);
    } catch (error) {
      next(error);
    }
  }

  async getAllSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const allSubscriptions = await this.getAllSubscriptionUseCase.execute();
      return ApiResposne.success(res, MESSAGES.SUCCESS.GET_ALL_SUBSCRIPTIONS, allSubscriptions);
    } catch (error) {
      next(error);
    }
  }
}
