import express from "express";
import { AuthController } from "./auth.controller.ts";
import { RegiterUserUseCase } from "../application/usecases/registerUserUseCase.ts";
import { UserRpository } from "../infrastructure/userRepository.ts";
import { OtpRepository } from "../infrastructure/otpRepository.ts";
import { OtpUseCase } from "../application/usecases/otpUseCase.ts";
import { LoginUserUseCase } from "../application/usecases/LoginUserUseCase.ts";
import { ForgetUseCase } from "../application/usecases/ForgetUseCase.ts";
import { ChangePasswordUseCase } from "../application/usecases/changePasswordUseCase.ts";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.ts";
import { validateRequest } from "../../../middleware/validateRequest.ts";
import { changePasswordSchema, forgetPasswordSchema, loginSchema, otpSchema, registerAdminSchema, registerSchema, resetPasswordSchema } from "../../../common/validation/authValidation.ts";
import { authMiddleware } from "../../../middleware/authMiddleware.ts";
import { ResendOtpUseCase } from "../application/usecases/ResendOtpUseCase.ts";
import { ResetPasswordUseCase } from "../application/usecases/ResetPasswordUseCase.ts";
import { RegisterWorkspaceAdminUseCase } from "../application/usecases/registerWorkspaceAdminUseCase.ts";
import { RegisterOwnerUseCase } from "../application/usecases/registerOwnerUseCase.ts";
import { GetInvitationDetailsUseCase } from "../application/usecases/getInvitationDetailsUseCase.ts";
import { WorkspaceReopsitory } from "../../workspace/infrastructure/workspaceRepository.ts";
import { OrganizationRepository } from "../../organization/infrastructure/organizationRepository.ts";

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
const resendOtpUseCase = new ResendOtpUseCase(otpRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userReopsitory);
const workspaceRepository = new WorkspaceReopsitory();
const organizationRepository = new OrganizationRepository();
const registerWorkspaceAdminUseCase=new RegisterWorkspaceAdminUseCase(userReopsitory, workspaceRepository);
const registerOwnerUseCase=new RegisterOwnerUseCase(userReopsitory, organizationRepository);
const getInvitationDetailsUseCase = new GetInvitationDetailsUseCase(workspaceRepository, organizationRepository);

const controller = new AuthController(
  registerUserUseCase,
  otpUseCase,
  loginUserUseCase,
  forgetUseCase,
  changePasswordUseCase,
  resendOtpUseCase,
  resetPasswordUseCase,
  registerWorkspaceAdminUseCase,
  registerOwnerUseCase,
  getInvitationDetailsUseCase
);

router.post(API_ROUTES.AUTH.REFRESH, controller.refreshToken.bind(controller));
router.post(API_ROUTES.AUTH.REGISTER, validateRequest(registerSchema), controller.register.bind(controller));
router.post(API_ROUTES.AUTH.VERIFY_OTP, validateRequest(otpSchema),controller.verifyOtp.bind(controller));
router.post(API_ROUTES.AUTH.RESEND_OTP, validateRequest(forgetPasswordSchema), controller.resendOtp.bind(controller));
router.post(API_ROUTES.AUTH.LOGIN,validateRequest(loginSchema), controller.login.bind(controller));
router.post(API_ROUTES.AUTH.LOGOUT,authMiddleware,controller.logout.bind(controller))
router.post(API_ROUTES.AUTH.FORGET_PASSWORD, validateRequest(forgetPasswordSchema),controller.forgetPassword.bind(controller),)
router.post(API_ROUTES.AUTH.CHANGE_PASSWORD,validateRequest(changePasswordSchema),authMiddleware,controller.changePassword.bind(controller),);
router.post(API_ROUTES.AUTH.RESET_PASSWORD, validateRequest(resetPasswordSchema),controller.resetPassword.bind(controller),);
router.get(API_ROUTES.AUTH.INVITATION, controller.getInvitationDetails.bind(controller));
router.post(API_ROUTES.AUTH.REGISTER_WORKSPACE_ADMIN,validateRequest(registerAdminSchema) ,controller.registerAdmin.bind(controller));
router.post('/create-owner',controller.registerOwner.bind(controller));

export default router;
