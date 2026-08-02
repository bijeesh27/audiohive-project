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
} from "../application/dtos/AuthDTO.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";
import {
  AccessDeniedError,
  InvalidRefreshToken,
  RefreshTokenNotFound,
} from "../../../common/Errors/Error.ts";
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
      let userData = await this.otpUseCase.execute(req.body);
      return ApiResposne.success(res, MESSAGES.SUCCESS.OTP_VERIFIED, userData);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.loginUserUseCase.execute(req.body);
      if (!user.status) {
        throw new AccessDeniedError();
      }
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
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.user.userEmail;

      await this.changePasswordUseCase.execute({ ...req.body, email });
      return ApiResposne.success(res, MESSAGES.SUCCESS.PASSWORD_CHANGED);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new RefreshTokenNotFound();
      }
      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!,
        (err: any, decoded: any) => {
          if (err) {
            throw new InvalidRefreshToken();
          }
          const newAccessToken = jwt.sign(
            { id: decoded.id, username: decoded.username, role: decoded.role },
            process.env.JWT_SECRET!,
            { expiresIn: "15m" },
          );
          return ApiResposne.success(res, MESSAGES.SUCCESS.TOKEN_REFRESHED, {
            accessToken: newAccessToken,
            userRole: decoded.role,
          });
        },
      );
    } catch (error) {
      next(error);
    }
  }
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true in production
        sameSite: "lax",
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.LOGOUT_SUCCESSFULLY);
    } catch (error) {
      next(error);
    }
  }
}
