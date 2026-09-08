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

const router = express.Router();
const userRepository = new UserRepository();
const workspaceRepository = new WorkspaceReopsitory();

const getAllUserUseCase = new GetAllUserUseCase(userRepository);
const sendUserInvitationUseCase = new SendUserInvitationUseCase(workspaceRepository);
const getWorkspaceDashboardStatsUseCase = new GetWorkspaceDashboardStatsUseCase(userRepository);
const getActiveUserUseCase=new GetActiveUserUseCase(userRepository)

const controller = new WorkspaceAdminController(getAllUserUseCase, sendUserInvitationUseCase, getWorkspaceDashboardStatsUseCase, workspaceRepository,getActiveUserUseCase);

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
router.get('/activeusers/:workspaceId',controller.getActiveUsers.bind(controller))

export default router;
