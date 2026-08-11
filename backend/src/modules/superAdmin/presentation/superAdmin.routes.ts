import express from "express";
import { SuperAdminController } from "./superAdmin.controller.ts";
import { GetAllUserUseCase } from "../application/usecases/getAllUserUseCase.ts";
import { UserRepository } from "../infrastructure/userRepository.ts";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware.ts";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { ApproveWorkspaceUseCase } from "../application/usecases/approveWorkspaceUseCase.ts";
import { WorkspaceReopsitory } from "../../workspace/infrastructure/workspaceRepository.ts";

const router = express.Router();
const userRepository = new UserRepository();
const workspaceRepository=new WorkspaceReopsitory()

const getAllUserUseCase = new GetAllUserUseCase(userRepository);
const approveWorkspaceUseCase=new ApproveWorkspaceUseCase(workspaceRepository)

const controller = new SuperAdminController(getAllUserUseCase,approveWorkspaceUseCase);

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
export default router;
