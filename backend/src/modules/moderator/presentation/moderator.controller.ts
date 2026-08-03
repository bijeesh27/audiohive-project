import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export class moderatorController {
  constructor(private readonly getAllUserUseCase: IuseCase<{ page: number; limit: number ,search?: string}, { users: IuserDocument[]; total: number } | null>) {}
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search=req.query.search as string|undefined;
      
      const data = await this.getAllUserUseCase.execute({ page, limit ,search});
      return ApiResposne.success(res,"Retrieved all Workspaceadmin",data)
    } catch (error) {
      next(error);
    }
  };
}
