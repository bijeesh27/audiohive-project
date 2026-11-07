import express from "express";
import { GetAllUserUseCase } from "../application/usecase/getAllUseruseCase.ts";
import { UserRepository } from "../infrastructure/userRepository.ts";
import { SendUserInvitationUseCase } from "../application/usecase/sendUserInvitationUseCase.ts";
import { WorkspaceReopsitory } from "../../workspace/infrastructure/workspaceRepository.ts";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware.ts";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { WorkspaceAdminController } from "./workspaceAdmin.controller.ts";
import { GetWorkspaceDashboardStatsUseCase } from "../application/usecase/getWorkspaceDashboardStatsUseCase.ts";
import { GetActiveUserUseCase } from "../application/usecase/getActiveUserUseCase.ts";

import { ResolveWorkspaceUseCase } from "../../workspace/application/usecase/resolveWorkspaceUseCase.ts";
import { UpdateWorkspaceMemberUseCase } from "../application/usecase/updateWorkspaceMemberUseCase.ts";
import { RemoveWorkspaceMemberUseCase } from "../application/usecase/removeWorkspaceMemberUseCase.ts";
import { UserRepository as AuthUserRepository } from "../../auth/infrastructure/userRepository.ts";
import { ActivityLogRepository } from "../../activityLog/infrastructure/activitylogRepository";
import { WorkspaceUserAnalyticsRepository } from "../infrastructure/workspaceUserAnalyticsRepository.ts";
import { GetWorkspaceUserAnalyticsUseCase } from "../application/usecase/getWorkspaceUserAnalyticsUseCase.ts";
import { GetUserActivityHistoryUseCase } from "../application/usecase/getUserActivityHistoryUseCase.ts";

const router = express.Router();
const activityLogRepository = new ActivityLogRepository();
const userRepository = new UserRepository();
const authUserRepository = new AuthUserRepository();
const workspaceRepository = new WorkspaceReopsitory();
const workspaceUserAnalyticsRepository = new WorkspaceUserAnalyticsRepository();

const getAllUserUseCase = new GetAllUserUseCase(userRepository);
const sendUserInvitationUseCase = new SendUserInvitationUseCase(workspaceRepository,activityLogRepository);
const getWorkspaceDashboardStatsUseCase = new GetWorkspaceDashboardStatsUseCase(userRepository);
const getActiveUserUseCase=new GetActiveUserUseCase(userRepository)

const resolveWorkspaceUseCase = new ResolveWorkspaceUseCase(workspaceRepository, authUserRepository);
const updateWorkspaceMemberUseCase = new UpdateWorkspaceMemberUseCase(userRepository);
const removeWorkspaceMemberUseCase = new RemoveWorkspaceMemberUseCase(userRepository);
const getWorkspaceUserAnalyticsUseCase = new GetWorkspaceUserAnalyticsUseCase(workspaceUserAnalyticsRepository);
const getUserActivityHistoryUseCase = new GetUserActivityHistoryUseCase(workspaceUserAnalyticsRepository);

const controller = new WorkspaceAdminController(
  getAllUserUseCase,
  sendUserInvitationUseCase,
  getWorkspaceDashboardStatsUseCase,
  resolveWorkspaceUseCase,
  getActiveUserUseCase,
  updateWorkspaceMemberUseCase,
  removeWorkspaceMemberUseCase,
  getWorkspaceUserAnalyticsUseCase,
  getUserActivityHistoryUseCase
);

router.get(
  API_ROUTES.WORKSPACE_ADMIN.GET_USERS,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.getAllUsers.bind(controller),
);

router.post(
  API_ROUTES.WORKSPACE_ADMIN.INVITE_USER,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.inviteUser.bind(controller),
);

router.get(
  API_ROUTES.WORKSPACE_ADMIN.DASHBOARD_STATS,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.getDashboardStats.bind(controller),
);

router.get(
  API_ROUTES.WORKSPACE_ADMIN.PROFILE,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.getProfile.bind(controller),
);

router.patch(
  API_ROUTES.WORKSPACE_ADMIN.UPDATE_USER,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.updateUser.bind(controller),
);

router.get(
  API_ROUTES.WORKSPACE_ADMIN.GET_ACTIVE_USERS,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.getActiveUsers.bind(controller),
);

router.get(
  API_ROUTES.WORKSPACE_ADMIN.USER_ANALYTICS,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.getUserAnalytics.bind(controller),
);

router.get(
  API_ROUTES.WORKSPACE_ADMIN.USER_ACTIVITY_HISTORY,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.getUserActivityHistory.bind(controller),
);

export default router;
