import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";
import {
  ApproveWorkspaceDTO,
  GetAllUsersDTO,
  GetAllUsersResultDTO,
  SuperAdminDashboardStatsDTO,
  UpdateUserDTO,
} from "../application/dtos/SuperAdminDTO.ts";

export class SuperAdminController {
  constructor(
    private readonly getAllUserUseCase: IuseCase<GetAllUsersDTO, GetAllUsersResultDTO | null>,
    private readonly approveWorkspaceUseCase: IuseCase<ApproveWorkspaceDTO, void>,
    private readonly updateUserUseCase: IuseCase<UpdateUserDTO, IuserDTO>,
    private readonly getSuperAdminDashboardStatsUseCase: IuseCase<void, SuperAdminDashboardStatsDTO>
  ) {}
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {

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
    
    return ApiResposne.success(res,MESSAGES.SUCCESS.USER_UPDATED , updatedUser);
  } catch (error) {
    next(error);
  }
};

  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.getSuperAdminDashboardStatsUseCase.execute();
      return ApiResposne.success(res, MESSAGES.SUCCESS.DASHBOARD_STATS_FETCHED, data);
    } catch (error) {
      next(error);
    }
  };
}
