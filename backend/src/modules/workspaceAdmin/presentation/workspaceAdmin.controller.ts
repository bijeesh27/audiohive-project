import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export class WorkspaceAdminController {
  constructor(private readonly getAllUserUseCase: IuseCase<{ page: number; limit: number }, { users: IuserDocument[]; total: number } | null>) {}
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const data = await this.getAllUserUseCase.execute({ page, limit });
      return ApiResposne.success(res,"Retrieved all moderator and members",data)
    } catch (error) {
      next(error);
    }
  };
}
