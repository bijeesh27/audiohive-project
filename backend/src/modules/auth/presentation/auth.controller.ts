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
      return ApiResposne.success(res, "registration in progress");
    } catch (error) {
      next(error);
    }
  }
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      let userData = await this.otpUseCase.execute(req.body);
      return ApiResposne.success(res, "otp-verified suceesfully", userData);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.loginUserUseCase.execute(req.body);
      const userRole = user?.role;
      const accessToken = jwt.sign(
        { username: user.username },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
      );
      const refreshToken = jwt.sign(
        { username: user.username },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: "7d" },
      );
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return ApiResposne.success(res, "login successfully", {
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
      return ApiResposne.success(res, "email verified", user);
    } catch (error) {
      next(error);
    }
  }
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.params.email;

      await this.changePasswordUseCase.execute({ ...req.body, email });
      return ApiResposne.success(res, "password changed successfully");
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found" });
      }
      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!,
        (err: any, decoded: any) => {
          if (err) {
            return res
              .status(403)
              .json({ message: "Invalid or expired refresh token" });
          }
          const newAccessToken = jwt.sign(
            { username: decoded.username },
            process.env.JWT_SECRET!,
            { expiresIn: "15m" },
          );
          return ApiResposne.success(res, "Token refreshed successfully", {
            accessToken: newAccessToken,
          });
        },
      );
    } catch (error) {
      next(error);
    }
  }
}
