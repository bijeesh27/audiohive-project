import express from "express";
import { GetAllUserUseCase } from "../application/usecase/getAllUseruseCase.ts";
import { UserRepository } from "../infrastructure/userRepository.ts";
import { SendUserInvitationUseCase } from "../application/usecase/sendUserInvitationUseCase.ts";
import { WorkspaceReopsitory } from "../../workspace/infrastructure/workspaceRepository.ts";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware.ts";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { WorkspaceAdminController } from "./workspaceAdmin.controller.ts";

const router = express.Router();
const userRepository = new UserRepository();
const workspaceRepository = new WorkspaceReopsitory();

const getAllUserUseCase = new GetAllUserUseCase(userRepository);
const sendUserInvitationUseCase = new SendUserInvitationUseCase(workspaceRepository);

const controller = new WorkspaceAdminController(getAllUserUseCase, sendUserInvitationUseCase);

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

export default router;
