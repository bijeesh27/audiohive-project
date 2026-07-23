import { NextFunction, Request, Response } from "express";
import { GetAllUserUseCase } from "../application/usecases/getAllUserUseCase.ts";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { UserDTO } from "../application/dtos/UserDTO.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export class SuperAdminController {
  constructor(private readonly getAllUserUseCase: IuseCase<UserDTO,IuserDocument[]|null>) {}
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.getAllUserUseCase.execute();
      return ApiResposne.success(res,"getting all users",users,200)
    } catch (error) {
      next(error);
    }
  };
}
