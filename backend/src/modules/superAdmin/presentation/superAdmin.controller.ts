import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";
import {
  ApproveWorkspaceDTO,
  GetAllUsersDTO,
  GetAllUsersResultDTO,
  SuperAdminDashboardStatsDTO,
  UpdateUserDTO,
} from "../application/dtos/SuperAdminDTO.ts";
import {
  SuperAdminDashboardQueryDTO,
  SuperAdminDashboardResponseDTO,
} from "../application/dtos/SuperAdminDashboardDTO.ts";
import { IsuperAdminOrganizationsRepository } from "../domain/IsuperAdminOrganizationsRepository.ts";
import { IuserRepository } from "../domain/IuserRepository.ts";
import { IsuperAdminSubscriptionsRepository } from "../domain/IsuperAdminSubscriptionsRepository.ts";
import { AuthRequest } from "../../../middleware/authMiddleware.ts";
import { AppError } from "../../../common/Errors/AppError.ts";
import { HttpStatus } from "../../../common/constant/httpStatus.ts";

export class SuperAdminController {
  constructor(
    private readonly getAllUserUseCase: IuseCase<GetAllUsersDTO, GetAllUsersResultDTO | null>,
    private readonly approveWorkspaceUseCase: IuseCase<ApproveWorkspaceDTO, void>,
    private readonly updateUserUseCase: IuseCase<UpdateUserDTO, IuserDTO>,
    private readonly getSuperAdminDashboardStatsUseCase: IuseCase<void, SuperAdminDashboardStatsDTO>,
    private readonly getSuperAdminDashboardAnalyticsUseCase?: IuseCase<
      SuperAdminDashboardQueryDTO,
      SuperAdminDashboardResponseDTO
    >,
    private readonly organizationsRepository?: IsuperAdminOrganizationsRepository,
    private readonly userRepository?: IuserRepository,
    private readonly subscriptionsRepository?: IsuperAdminSubscriptionsRepository
  ) {}

  getPlans = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.subscriptionsRepository) {
        throw new AppError("SubscriptionsRepository not configured", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const plans = await this.subscriptionsRepository.getAllPlans();
      return ApiResposne.success(res, "Subscription plans fetched successfully", plans);
    } catch (error) {
      next(error);
    }
  };

  checkPlanImpact = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.subscriptionsRepository) {
        throw new AppError("SubscriptionsRepository not configured", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const planId = req.params.id as string;
      const newMaxWorkspaces = parseInt(req.query.newMaxWorkspaces as string, 10);
      if (isNaN(newMaxWorkspaces)) {
        throw new AppError("Invalid newMaxWorkspaces query parameter", HttpStatus.BAD_REQUEST);
      }
      const impact = await this.subscriptionsRepository.checkPlanImpact(planId, newMaxWorkspaces);
      return ApiResposne.success(res, "Plan impact checked successfully", impact);
    } catch (error) {
      next(error);
    }
  };

  createPlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.subscriptionsRepository) {
        throw new AppError("SubscriptionsRepository not configured", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const actorId = req.user?.id || "";
      const actorEmail = req.user?.userEmail || "";
      const created = await this.subscriptionsRepository.createPlan(req.body, actorId, actorEmail);
      return ApiResposne.success(res, "Plan created successfully", created, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  updatePlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.subscriptionsRepository) {
        throw new AppError("SubscriptionsRepository not configured", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const planId = req.params.id as string;
      const actorId = req.user?.id || "";
      const actorEmail = req.user?.userEmail || "";
      const updated = await this.subscriptionsRepository.updatePlan(planId, req.body, actorId, actorEmail);
      return ApiResposne.success(res, "Plan updated successfully", updated);
    } catch (error) {
      next(error);
    }
  };

  updatePlanStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.subscriptionsRepository) {
        throw new AppError("SubscriptionsRepository not configured", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const planId = req.params.id as string;
      const { status } = req.body;
      const actorId = req.user?.id || "";
      const actorEmail = req.user?.userEmail || "";
      if (!["active", "inactive", "archived"].includes(status)) {
        throw new AppError("Invalid status value", HttpStatus.BAD_REQUEST);
      }
      const updated = await this.subscriptionsRepository.updatePlanStatus(planId, status, actorId, actorEmail);
      return ApiResposne.success(res, `Plan status updated to ${status}`, updated);
    } catch (error) {
      next(error);
    }
  };

  setDefaultPlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.subscriptionsRepository) {
        throw new AppError("SubscriptionsRepository not configured", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const planId = req.params.id as string;
      const actorId = req.user?.id || "";
      const actorEmail = req.user?.userEmail || "";
      const updated = await this.subscriptionsRepository.setDefaultPlan(planId, actorId, actorEmail);
      return ApiResposne.success(res, `Plan "${updated.subscriptionName}" set as default`, updated);
    } catch (error) {
      next(error);
    }
  };

  deletePlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.subscriptionsRepository) {
        throw new AppError("SubscriptionsRepository not configured", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const planId = req.params.id as string;
      const actorId = req.user?.id || "";
      const actorEmail = req.user?.userEmail || "";
      const result = await this.subscriptionsRepository.deletePlan(planId, actorId, actorEmail);
      return ApiResposne.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  getSubscriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.subscriptionsRepository) {
        throw new AppError("SubscriptionsRepository not configured", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const search = req.query.search as string | undefined;
      const planId = req.query.planId as string | undefined;
      const status = req.query.status as string | undefined;
      const nearLimit = req.query.nearLimit === "true";
      const sort = req.query.sort as "newest" | "oldest" | "name" | "workspaces" | undefined;

      const result = await this.subscriptionsRepository.getSubscriptions({
        page,
        limit,
        search,
        planId,
        status,
        nearLimit,
        sort,
      });

      return ApiResposne.success(res, "Subscriptions fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };

  changeOrganizationSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.subscriptionsRepository) {
        throw new AppError("SubscriptionsRepository not configured", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const organizationId = req.params.orgId as string;
      const { planId } = req.body;
      if (!planId) {
        throw new AppError("Plan ID is required", HttpStatus.BAD_REQUEST);
      }
      const actorId = req.user?.id || "";
      const actorEmail = req.user?.userEmail || "";

      const result = await this.subscriptionsRepository.changeOrganizationPlan(
        organizationId,
        planId,
        actorId,
        actorEmail
      );
      return ApiResposne.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.userRepository) {
        throw new AppError("UserRepository not configured in SuperAdminController", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;
      const presence = req.query.presence as string | undefined;
      const organizationId = req.query.organizationId as string | undefined;
      const workspaceId = req.query.workspaceId as string | undefined;
      const sort = req.query.sort as "newest" | "oldest" | "name" | "lastActive" | undefined;

      const result = await this.userRepository.getSuperAdminUsers({
        page,
        limit,
        search,
        role,
        status,
        presence,
        organizationId,
        workspaceId,
        sort,
      });

      return ApiResposne.success(res, "Platform users fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };

  toggleUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.userRepository) {
        throw new AppError("UserRepository not configured in SuperAdminController", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const targetUserId = req.params.id as string;
      const { status } = req.body;
      const actorId = req.user?.id || "";
      const actorEmail = req.user?.userEmail || "";

      if (typeof status !== "boolean") {
        throw new AppError("Invalid status value provided.", HttpStatus.BAD_REQUEST);
      }

      const result = await this.userRepository.updateUserStatus({
        targetUserId,
        status,
        actorId,
        actorEmail,
      });

      return ApiResposne.success(
        res,
        `User ${status ? "enabled" : "disabled"} successfully`,
        result
      );
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const data = await this.getAllUserUseCase.execute({ page, limit, search });
      return ApiResposne.success(res, MESSAGES.SUCCESS.GET_WORKSPACE_ADMIN, data);
    } catch (error) {
      next(error);
    }
  };

  approveWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, adminEmail, workspaceName, workspaceAdminName } = req.body;

      await this.approveWorkspaceUseCase.execute({
        workspaceId,
        adminEmail,
        workspaceName,
        workspaceAdminName,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_APPROVED, null);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const updateData = req.body;
      const updatedUser = await this.updateUserUseCase.execute({ userId: id, updateData });

      return ApiResposne.success(res, MESSAGES.SUCCESS.USER_UPDATED, updatedUser);
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.getSuperAdminDashboardStatsUseCase.execute();
      return ApiResposne.success(res, MESSAGES.SUCCESS.DASHBOARD_STATS_FETCHED, data);
    } catch (error) {
      next(error);
    }
  };

  getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.getSuperAdminDashboardAnalyticsUseCase) {
        throw new Error("SuperAdminDashboardAnalyticsUseCase not configured");
      }
      const range = (req.query.range as "today" | "7d" | "30d" | "custom") || "7d";
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const data = await this.getSuperAdminDashboardAnalyticsUseCase.execute({
        range,
        startDate,
        endDate,
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.DASHBOARD_STATS_FETCHED, data);
    } catch (error) {
      next(error);
    }
  };

  // --- Organizations Management ---

  getOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.organizationsRepository) {
        throw new Error("OrganizationsRepository not configured");
      }
      const { page, limit, search, plan, status, nearLimit, sort } = req.query;

      const data = await this.organizationsRepository.getOrganizations({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string | undefined,
        plan: plan as string | undefined,
        status: status as string | undefined,
        nearLimit: nearLimit as string | undefined,
        sort: sort as "newest" | "oldest" | "name" | "members" | "lastActivity" | undefined,
      });

      return ApiResposne.success(res, "Organizations fetched successfully", data);
    } catch (error) {
      next(error);
    }
  };

  getOrganizationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.organizationsRepository) {
        throw new Error("OrganizationsRepository not configured");
      }
      const id = req.params.id as string;
      const data = await this.organizationsRepository.getOrganizationById(id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Organization not found" });
      }

      return ApiResposne.success(res, "Organization details fetched successfully", data);
    } catch (error) {
      next(error);
    }
  };

  updateOrganizationStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!this.organizationsRepository) {
        throw new Error("OrganizationsRepository not configured");
      }
      const id = req.params.id as string;
      const { status, reason } = req.body;
      const actorId = req.user?.id || "superadmin";

      await this.organizationsRepository.updateOrganizationStatus(
        id,
        status,
        actorId,
        reason
      );

      return ApiResposne.success(res, `Organization status updated to ${status}`, null);
    } catch (error) {
      next(error);
    }
  };

  updateOrganizationPlan = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!this.organizationsRepository) {
        throw new Error("OrganizationsRepository not configured");
      }
      const id = req.params.id as string;
      const { planId } = req.body;
      const actorId = req.user?.id || "superadmin";

      await this.organizationsRepository.updateOrganizationPlan(id, planId, actorId);

      return ApiResposne.success(res, "Organization plan updated successfully", null);
    } catch (error) {
      next(error);
    }
  };

  updateOrganizationDetails = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!this.organizationsRepository) {
        throw new Error("OrganizationsRepository not configured");
      }
      const id = req.params.id as string;
      const { companyName, slug, ownerName, ownerEmail } = req.body;
      const actorId = req.user?.id || "superadmin";

      await this.organizationsRepository.updateOrganizationDetails(
        id,
        { companyName, slug, ownerName, ownerEmail },
        actorId
      );

      return ApiResposne.success(res, "Organization details updated successfully", null);
    } catch (error) {
      next(error);
    }
  };

  archiveOrganization = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!this.organizationsRepository) {
        throw new Error("OrganizationsRepository not configured");
      }
      const id = req.params.id as string;
      const actorId = req.user?.id || "superadmin";

      await this.organizationsRepository.archiveOrganization(id, actorId);

      return ApiResposne.success(res, "Organization archived successfully", null);
    } catch (error) {
      next(error);
    }
  };
}
