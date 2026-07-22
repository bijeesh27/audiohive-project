import { NextFunction, Request, Response } from "express";
import { RegiterUserUseCase } from "../application/usecases/registerUserUseCase.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";
import { OtpUseCase } from "../application/usecases/otpUseCase.ts";
import { LoginUserUseCase } from "../application/usecases/LoginUserUseCase.ts";
import jwt from "jsonwebtoken";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { ForgetUseCase } from "../application/usecases/ForgetUseCase.ts";
import { ChangePasswordUseCase } from "../application/usecases/changePasswordUseCase.ts";

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegiterUserUseCase,
    private readonly otpUseCase: OtpUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly forgetUseCase: ForgetUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
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
        { expiresIn: "15m" }, // Access token expires in 15 minutes
      );
       const refreshToken = jwt.sign(
        { username: user.username },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' } // Refresh token expires in 7 days
      );
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Ensure secure is true in production
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
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.forgetUseCase.excute(req.body);
      return ApiResposne.success(res, "email verified", user);
    } catch (error) {
      next(error);
    }
  }
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.params.email;

      await this.changePasswordUseCase.execute(req.body, email);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Note: This requires cookie-parser middleware in your main app
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found" });
      }
      // Verify the refresh token
      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!,
        (err: any, decoded: any) => {
          if (err) {
            return res
              .status(403)
              .json({ message: "Invalid or expired refresh token" });
          }
          // Generate a new access token
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
