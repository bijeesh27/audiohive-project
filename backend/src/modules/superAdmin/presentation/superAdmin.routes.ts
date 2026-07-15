import express from "express";
import { Router } from "express";
import { SuperAdminController } from "./superAdmin.controller.ts";
import { GetAllUserUseCase } from "../application/usecases/getAllUserUseCase.ts";
import { UserRepository } from "../infrastructure/userRepository.ts";
import { authMiddleware } from "../../../middleware/authMiddleware.ts";

const router = express.Router();
const userRepository = new UserRepository();

const getAllUserUseCase = new GetAllUserUseCase(userRepository);

const controller = new SuperAdminController(getAllUserUseCase);

router.get(
  "/get-users",
  authMiddleware,
  controller.getAllUsers.bind(controller),
);

export default router;
