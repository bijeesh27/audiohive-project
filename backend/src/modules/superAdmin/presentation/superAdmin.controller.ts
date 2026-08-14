import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";
import logger from "../../../shared/utils/logger.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";

export class SuperAdminController {
  constructor(
    private readonly getAllUserUseCase: IuseCase<{ page: number; limit: number,search?: string }, { users: IuserDocument[]; total: number } | null>,
    private readonly approveWorkspaceUseCase:IuseCase<{ workspaceId: string, adminEmail: string, workspaceName: string, workspaceAdminName: string }, void>,
    private readonly updateUserUseCase:IuseCase<{ userId: string, updateData: Partial<IuserDocument> }, IuserDocument>
  ) {}
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info("this is from super admin")
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search=req.query.search as string|undefined;
      
      const data = await this.getAllUserUseCase.execute({ page, limit,search });
      return ApiResposne.success(res,MESSAGES.SUCCESS.GET_WORKSPACE_ADMIN,data)
    } catch (error) {
      next(error);
    }
  };
  approveWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, adminEmail, workspaceName,workspaceAdminName   } = req.body;
      
      await this.approveWorkspaceUseCase.execute({ workspaceId, adminEmail, workspaceName,workspaceAdminName  });
      
      return ApiResposne.success(res,MESSAGES.SUCCESS.WORKSPACE_APPROVED , null);
    } catch (error) {
      next(error);
    }
  };
  updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const updateData = req.body;
    const updatedUser = await this.updateUserUseCase.execute({ userId: id, updateData });
    
    return ApiResposne.success(res, "User updated successfully", updatedUser);
  } catch (error) {
    next(error);
  }
};
}
