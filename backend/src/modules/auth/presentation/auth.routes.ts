import express from "express";
import { Router } from "express";
import { AuthController } from "./auth.controller.ts";
import { RegiterUserUseCase } from "../application/usecases/registerUserUseCase.ts";
import { UserRpository } from "../infrastructure/userRepository.ts";
import { OtpRepository } from "../infrastructure/otpRepository.ts";
import { OtpUseCase } from "../application/usecases/otpUseCase.ts";
import { LoginUserUseCase } from "../application/usecases/LoginUserUseCase.ts";
import { ForgetUseCase } from "../application/usecases/ForgetUseCase.ts";
import { ChangePasswordUseCase } from "../application/usecases/changePasswordUseCase.ts";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.ts";
const router = express.Router();

const userReopsitory = new UserRpository();
const otpRepository = new OtpRepository();
const registerUserUseCase = new RegiterUserUseCase(
  userReopsitory,
  otpRepository,
);
const otpUseCase = new OtpUseCase(otpRepository, userReopsitory);
const loginUserUseCase = new LoginUserUseCase(userReopsitory);
const forgetUseCase = new ForgetUseCase(userReopsitory, otpRepository);
const changePasswordUseCase = new ChangePasswordUseCase(userReopsitory);

const controller = new AuthController(
  registerUserUseCase,
  otpUseCase,
  loginUserUseCase,
  forgetUseCase,
  changePasswordUseCase,
);

router.post(API_ROUTES.AUTH.REFRESH, controller.refreshToken.bind(controller));
router.post(API_ROUTES.AUTH.REGISTER, controller.register.bind(controller));
router.post(API_ROUTES.AUTH.VERIFY_OTP, controller.verifyOtp.bind(controller));
router.post(API_ROUTES.AUTH.LOGIN, controller.login.bind(controller));
// router.post('/verify-email',controller.verifyEmail.bind(controller))
router.post(
  API_ROUTES.AUTH.FORGET_PASSWORD,
  controller.forgetPassword.bind(controller),
);
router.post(
  API_ROUTES.AUTH.CHANGE_PASSWORD,
  controller.changePassword.bind(controller),
);

export default router;
