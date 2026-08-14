import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";

export class WorkspaceAdminController {
  constructor(private readonly getAllUserUseCase: IuseCase<{ page: number; limit: number,search?: string }, { users: IuserDocument[]; total: number } | null>) {}
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search=req.query.search as string|undefined;
      
      const data = await this.getAllUserUseCase.execute({ page, limit,search });
      return ApiResposne.success(res,MESSAGES.SUCCESS.GET_ALL_MEMBERS,data)
    } catch (error) {
      next(error);
    }
  };
}
