import express from "express";
import { GetAllUserUseCase } from "../application/usecase/getAllUseruseCase.ts";
import { UserRepository } from "../infrastructure/userRepository.ts";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware.ts";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { WorkspaceAdminController } from "./workspaceAdmin.controller.ts";

const router = express.Router();
const userRepository = new UserRepository();

const getAllUserUseCase = new GetAllUserUseCase(userRepository);

const controller = new WorkspaceAdminController(getAllUserUseCase);

router.get(
  API_ROUTES.WORKSPACE_ADMIN.GET_USERS,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.getAllUsers.bind(controller),
);

export default router;
