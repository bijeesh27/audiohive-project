import { NextFunction, Request, Response } from "express";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";
import jwt from "jsonwebtoken";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import {
  ChangePasswordDTO,
  ForgetPasswordDTO,
  LoginDTO,
  OtpDTO,
  RegisterDTO,
  ResetPasswordDTO
} from "../application/dtos/AuthDTO.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";
import {
  InvalidOtpError,
  InvalidRefreshToken,
  InvalidToken,
  RefreshTokenNotFound,
} from "../../../common/Errors/AuthError.ts";
import { AuthRequest } from "../../../middleware/authMiddleware.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { InvitationError } from "../../../common/Errors/WorkspaceError.ts";
export class AuthController {
  constructor(
    private readonly registerUserUseCase: IuseCase<RegisterDTO, void>,
    private readonly otpUseCase: IuseCase<OtpDTO, IuserDocument | void>,
    private readonly loginUserUseCase: IuseCase<LoginDTO, IuserDocument>,
    private readonly forgetUseCase: IuseCase<ForgetPasswordDTO, IuserDocument>,
    private readonly changePasswordUseCase: IuseCase<
      ChangePasswordDTO & { email: string },
      IuserDocument
    >,
    private readonly resendOtpUseCase: IuseCase<{ email: string }, void>,
    private readonly resetPasswordUseCase: IuseCase<ResetPasswordDTO, IuserDocument>,
    private readonly registerWorkspaceAdminUseCase:IuseCase<RegisterDTO,void>,
    private readonly registerOwnerUseCase:IuseCase<any,void>,
    private readonly getInvitationDetailsUseCase:IuseCase<string,any>
  ) {}
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      await this.registerUserUseCase.execute(req.body);
      return ApiResposne.success(
        res,
        MESSAGES.SUCCESS.REGISTRATION_IN_PROGRESS,
      );
    } catch (error) {
      next(error);
    }
  }
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = await this.otpUseCase.execute(req.body);
      
      if (req.body.purpose === "forget") {
         const resetToken = jwt.sign(
           { email: (userData as IuserDocument).email, type: "reset" },
           process.env.JWT_SECRET!,
           { expiresIn: "15m" }
         );
         return ApiResposne.success(res, MESSAGES.SUCCESS.OTP_VERIFIED, { resetToken });
      }

      return ApiResposne.success(res, MESSAGES.SUCCESS.OTP_VERIFIED, userData);
    } catch (error) {
      next(error);
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      await this.resendOtpUseCase.execute(req.body);
      return ApiResposne.success(res,MESSAGES.SUCCESS.OTP_SEND_SUCCESSFULLY );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.loginUserUseCase.execute(req.body);
      const userRole = user?.role;
      const accessToken = jwt.sign(
        {
          id: user._id,
          username: user.username,
          userEmail: user.email,
          role: userRole,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
      );
      const refreshToken = jwt.sign(
        {
          id: user._id,
          username: user.username,
          userEmail: user.email,
          role: userRole,
        },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: "7d" },
      );
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: parseInt(process.env.MAX_AGE!),
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.LOGIN_SUCCESS, {
        accessToken,
        userRole,
      });
    } catch (error) {
      next(error);
    }
  }
  async forgetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.forgetUseCase.execute(req.body);
      return ApiResposne.success(res, MESSAGES.SUCCESS.EMAIL_VERIFIED, user);
    } catch (error) {
      next(error);
    }
  }
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const email = req.user?.userEmail;

      await this.changePasswordUseCase.execute({ ...req.body, email });
      return ApiResposne.success(res, MESSAGES.SUCCESS.PASSWORD_CHANGED);
    } catch (error) {
      next(error);
    }
  }

  
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      
      let decoded: jwt.JwtPayload;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!)as jwt.JwtPayload;
      } catch{
        throw new InvalidToken();
      }

      if (decoded.type !== "reset" || !decoded.email) {
        throw new InvalidToken();
      }

      await this.resetPasswordUseCase.execute({ email: decoded.email, password });
      return ApiResposne.success(res, MESSAGES.SUCCESS.PASSWORD_CHANGED);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        throw new RefreshTokenNotFound();
      }

      let decoded: jwt.JwtPayload;
      try {
        decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET! )as jwt.JwtPayload;
      } catch {
        throw new InvalidRefreshToken();
      }

      const newAccessToken = jwt.sign(
        { id: decoded.id, username: decoded.username, userEmail: decoded.userEmail, role: decoded.role },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
      );

      return ApiResposne.success(res, MESSAGES.SUCCESS.TOKEN_REFRESHED, {
        accessToken: newAccessToken,
        userRole: decoded.role,
      });
    } catch (error) {
      next(error);
    }
  }
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.LOGOUT_SUCCESSFULLY);
    } catch (error) {
      next(error);
    }
  }

async getInvitationDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const { token } = req.params;
        const invitation = await this.getInvitationDetailsUseCase.execute(token as string);
        return ApiResposne.success(res,MESSAGES.SUCCESS.INVITATION_VALID ,invitation );
    } catch (error) {
        next(error);
    }
}

async registerAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        await this.registerWorkspaceAdminUseCase.execute(req.body)
        return ApiResposne.success(res,MESSAGES.SUCCESS.REGISTARTION_SUCCESSFULLY, null);
    } catch (error) {
        next(error);
    }
}
async registerOwner(req: Request, res: Response, next: NextFunction) {
    try {
        await this.registerOwnerUseCase.execute(req.body)
        return ApiResposne.success(res,MESSAGES.SUCCESS.REGISTARTION_SUCCESSFULLY, null);
    } catch (error) {
        next(error);
    }
}
}
