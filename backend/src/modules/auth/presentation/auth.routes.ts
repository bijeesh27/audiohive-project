import express from "express";
import { Router } from "express";
import { AuthController } from "./auth.controller.ts";
import { RegiterUserUseCase } from "../application/usecases/registerUserUseCase.ts";
import { UserRpository } from "../infrastructure/userRepository.ts";
import { OtpRepository } from "../infrastructure/otpRepository.ts";
import { OtpUseCase } from "../application/usecases/otpUseCase.ts";
import { LoginUserUseCase } from "../application/usecases/LoginUserUseCase.ts";
import { authMiddleware } from "../../../middleware/authMiddleware.ts";
const router = express.Router();

const userReopsitory = new UserRpository();
const otpRepository = new OtpRepository();
const registerUserUseCase = new RegiterUserUseCase(
  userReopsitory,
  otpRepository,
);
const otpUseCase = new OtpUseCase(otpRepository, userReopsitory);
const loginUserUseCase = new LoginUserUseCase(userReopsitory);

const controller = new AuthController(
  registerUserUseCase,
  otpUseCase,
  loginUserUseCase,
);

router.post("/register", controller.register.bind(controller));
router.post("/verify-otp", controller.verifyOtp.bind(controller));
router.post("/login", controller.login.bind(controller));

export default router;
