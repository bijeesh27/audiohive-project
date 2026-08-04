import express from "express";
import { SuperAdminController } from "./superAdmin.controller.ts";
import { GetAllUserUseCase } from "../application/usecases/getAllUserUseCase.ts";
import { UserRepository } from "../infrastructure/userRepository.ts";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware.ts";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";

const router = express.Router();
const userRepository = new UserRepository();

const getAllUserUseCase = new GetAllUserUseCase(userRepository);

const controller = new SuperAdminController(getAllUserUseCase);

router.get(
  API_ROUTES.SUPER_ADMIN.GET_USERS,
  authMiddleware,
  roleMiddleware([UserRoles.SUPER_ADMIN]),
  controller.getAllUsers.bind(controller),
);

export default router;
