import { NextFunction, Request, Response } from "express";
import { GetAllUserUseCase } from "../application/usecases/getAllUserUseCase.ts";
import { ApiResposne } from "../../../common/Response/Response.ts";

export class SuperAdminController {
  constructor(private readonly getAllUserUseCase: GetAllUserUseCase) {}
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.getAllUserUseCase.execute();
      return ApiResposne.success(res,"getting all users",users,200)
    } catch (error) {
      next(error);
    }
  };
}
