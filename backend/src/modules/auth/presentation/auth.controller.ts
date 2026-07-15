import { NextFunction, Request, Response } from "express";
import { RegiterUserUseCase } from "../application/usecases/registerUserUseCase.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";
import { OtpUseCase } from "../application/usecases/otpUseCase.ts";
import { LoginUserUseCase } from "../application/usecases/LoginUserUseCase.ts";
import jwt from "jsonwebtoken";
import { ApiResposne } from "../../../common/Response/Response.ts";

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegiterUserUseCase,
    private readonly otpUseCase: OtpUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      await this.registerUserUseCase.execute(req.body);
      return ApiResposne.success(res,'registration in progress',)
    } catch (error) {
      next(error);
    }
  }
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      await this.otpUseCase.execute(req.body);
      return ApiResposne.success(res,'otp-verified suceesfully',)
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.loginUserUseCase.execute(req.body);
      let accessToken = jwt.sign(user.name, process.env.JWT_SECRET!);
      let refreshToken = jwt.sign(user.name, process.env.JWT_REFRESH_SECRET!);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
      });
      return ApiResposne.success(res,'login successfully',{accessToken})
    } catch (error) {
      next(error);
    }
  }
}
