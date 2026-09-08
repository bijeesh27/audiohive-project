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

const router = express.Router();
const userRepository = new UserRepository();
const workspaceRepository=new WorkspaceReopsitory()

const getAllUserUseCase = new GetAllUserUseCase(userRepository);
const approveWorkspaceUseCase=new ApproveWorkspaceUseCase(workspaceRepository)

const authUserRepository = new AuthUserRepository();
const updateUserUseCase = new UpdateUserUseCase(authUserRepository);
const getSuperAdminDashboardStatsUseCase = new GetSuperAdminDashboardStatsUseCase(userRepository);

const controller = new SuperAdminController(getAllUserUseCase,approveWorkspaceUseCase,updateUserUseCase,getSuperAdminDashboardStatsUseCase);

router.get(
  API_ROUTES.SUPER_ADMIN.GET_USERS,
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.getAllUsers.bind(controller),
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
export default router;
