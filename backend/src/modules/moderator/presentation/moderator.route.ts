import express from "express";
import { Router } from "express";
import { GetAllUserUseCase } from "../application/usecases/getAllUserUseCase.ts";
import { UserRepository } from "../infrastructure/userRepository.ts";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware.ts";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { moderatorController } from "./moderator.controller.ts";

const router = express.Router();
const userRepository = new UserRepository();

const getAllUserUseCase = new GetAllUserUseCase(userRepository);

const controller = new moderatorController(getAllUserUseCase);

router.get(
  API_ROUTES.MODERATOR.GET_USERS,
  authMiddleware,
  roleMiddleware([UserRoles.MODERATOR]),
  controller.getAllUsers.bind(controller),
);

export default router;
