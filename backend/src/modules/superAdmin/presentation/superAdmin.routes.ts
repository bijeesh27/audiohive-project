import { ActivityLogRepository } from "../../activityLog/infrastructure/activitylogRepository";
import express from "express";
import { SuperAdminController } from "./superAdmin.controller.ts";
import { GetAllUserUseCase } from "../application/usecases/getAllUserUseCase.ts";
import { UserRepository } from "../infrastructure/userRepository.ts";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware.ts";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { ApproveWorkspaceUseCase } from "../application/usecases/approveWorkspaceUseCase.ts";
import { WorkspaceReopsitory } from "../../workspace/infrastructure/workspaceRepository.ts";
import { UpdateUserUseCase } from "../application/usecases/updateUserUseCase.ts";
import { UserRepository as AuthUserRepository } from "../../auth/infrastructure/userRepository.ts";
import { GetSuperAdminDashboardStatsUseCase } from "../application/usecases/getSuperAdminDashboardStatsUseCase.ts";
import { GetSuperAdminDashboardAnalyticsUseCase } from "../application/usecases/getSuperAdminDashboardAnalyticsUseCase.ts";
import { SuperAdminAnalyticsRepository } from "../infrastructure/superAdminAnalyticsRepository.ts";
import { SuperAdminOrganizationsRepository } from "../infrastructure/superAdminOrganizationsRepository.ts";
import { SuperAdminSubscriptionsRepository } from "../infrastructure/superAdminSubscriptionsRepository.ts";

const activityLogRepository = new ActivityLogRepository();
const router = express.Router();
const userRepository = new UserRepository();
const workspaceRepository = new WorkspaceReopsitory();

const getAllUserUseCase = new GetAllUserUseCase(userRepository);
const approveWorkspaceUseCase = new ApproveWorkspaceUseCase(workspaceRepository, activityLogRepository);

const authUserRepository = new AuthUserRepository();
const updateUserUseCase = new UpdateUserUseCase(authUserRepository, activityLogRepository);
const getSuperAdminDashboardStatsUseCase = new GetSuperAdminDashboardStatsUseCase(userRepository);

const superAdminAnalyticsRepository = new SuperAdminAnalyticsRepository();
const getSuperAdminDashboardAnalyticsUseCase = new GetSuperAdminDashboardAnalyticsUseCase(
  superAdminAnalyticsRepository
);

const superAdminOrganizationsRepository = new SuperAdminOrganizationsRepository();
const superAdminSubscriptionsRepository = new SuperAdminSubscriptionsRepository();

const controller = new SuperAdminController(
  getAllUserUseCase,
  approveWorkspaceUseCase,
  updateUserUseCase,
  getSuperAdminDashboardStatsUseCase,
  getSuperAdminDashboardAnalyticsUseCase,
  superAdminOrganizationsRepository,
  userRepository,
  superAdminSubscriptionsRepository
);

// Consolidated Dashboard Analytics endpoint
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.getDashboardAnalytics.bind(controller)
);

// Organizations Management (Super Admin Exclusive)
router.get(
  "/organizations",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.getOrganizations.bind(controller)
);

router.get(
  "/organizations/:id",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.getOrganizationById.bind(controller)
);

router.patch(
  "/organizations/:id/status",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.updateOrganizationStatus.bind(controller)
);

router.patch(
  "/organizations/:id/plan",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.updateOrganizationPlan.bind(controller)
);

router.patch(
  "/organizations/:id",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.updateOrganizationDetails.bind(controller)
);

router.delete(
  "/organizations/:id",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.archiveOrganization.bind(controller)
);

// Users Management (Super Admin Exclusive)
router.get(
  "/users",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.getUsers.bind(controller)
);

router.get(
  API_ROUTES.SUPER_ADMIN.GET_USERS,
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.getUsers.bind(controller)
);

router.patch(
  "/users/:id/status",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.toggleUserStatus.bind(controller)
);

router.post(
  API_ROUTES.SUPER_ADMIN.APPROVE_WORKSPACE,
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.approveWorkspace.bind(controller)
);

router.patch(
  API_ROUTES.SUPER_ADMIN.GET_USER,
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN, UserRoles.WORKSPACE_ADMIN, UserRoles.ORGANIZATION_OWNER]),
  controller.updateUser.bind(controller)
);

router.get(
  API_ROUTES.SUPER_ADMIN.DASHBOARD_STATS,
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.getDashboardStats.bind(controller)
);

// Plans & Subscriptions Management (Super Admin Exclusive)
router.get(
  "/plans",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.getPlans.bind(controller)
);

router.get(
  "/plans/:id/impact",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.checkPlanImpact.bind(controller)
);

router.post(
  "/plans",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.createPlan.bind(controller)
);

router.patch(
  "/plans/:id",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.updatePlan.bind(controller)
);

router.patch(
  "/plans/:id/status",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.updatePlanStatus.bind(controller)
);

router.patch(
  "/plans/:id/default",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.setDefaultPlan.bind(controller)
);

router.delete(
  "/plans/:id",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.deletePlan.bind(controller)
);

router.get(
  "/subscriptions",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.getSubscriptions.bind(controller)
);

router.patch(
  "/subscriptions/:orgId/plan",
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.changeOrganizationSubscription.bind(controller)
);

export default router;
