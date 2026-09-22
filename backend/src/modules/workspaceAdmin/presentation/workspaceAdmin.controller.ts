import { NextFunction, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";
import { AuthRequest } from "../../../middleware/authMiddleware.ts";
import { IworkspaceRepository } from "../../workspace/domain/IworkspaceRepository.ts";
import { SendUserInvitationDTO } from "../application/usecase/sendUserInvitationUseCase.ts";
import { WorkspaceNotFound } from "../../../common/Errors/WorkspaceError.ts";
import { AccessDeniedError } from "../../../common/Errors/AuthError.ts";
import { GetActiveUserUseCase } from "../application/usecase/getActiveUserUseCase.ts";

export class WorkspaceAdminController {
  constructor(
    private readonly getAllUserUseCase: IuseCase<{ workspaceId: string; page: number; limit: number,search?: string }, { users: IuserDocument[]; total: number } | null>,
    private readonly sendUserInvitationUseCase: IuseCase<SendUserInvitationDTO, void>,
    private readonly getWorkspaceDashboardStatsUseCase: IuseCase<string, { totalRooms: number; totalUsers: number }>,
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly getActiveUserUseCase:IuseCase<any,any>,
    private readonly userRepository: { updateUser(userId: string, data: any): Promise<IuserDocument> }
  ) {}

  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      
      const userEmail = req.user?.userEmail;
      const workspace = userEmail ? await this.workspaceRepository.findByAdminEmail(userEmail) : null;
      if (!workspace) {
         return res.status(404).json({ message: MESSAGES.ERRORS.WORKSPACE_ADMIN_NOT_FOUND });
      }

      const data = await this.getAllUserUseCase.execute({ workspaceId: workspace._id.toString(), page, limit, search });
      return ApiResposne.success(res, MESSAGES.SUCCESS.GET_ALL_MEMBERS, data);
    } catch (error) {
      next(error);
    }
  };

  inviteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceAdminEmail = req.user?.userEmail;
      if (!workspaceAdminEmail) {
        throw new AccessDeniedError();
      }

      const workspace = await this.workspaceRepository.findByAdminEmail(workspaceAdminEmail);
      if (!workspace) {
        throw new WorkspaceNotFound();
      }

      const { email, invitedName, role } = req.body;
      
      await this.sendUserInvitationUseCase.execute({
        workspaceId: workspace._id.toString(),
        email,
        invitedName,
        role,
        workspaceAdminEmail
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.INVITATION_SEND);
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userEmail = req.user?.userEmail;
      const workspace = userEmail ? await this.workspaceRepository.findByAdminEmail(userEmail) : null;
      if (!workspace) {
        return res.status(404).json({ message: MESSAGES.ERRORS.WORKSPACE_ADMIN_NOT_FOUND });
      }
      const data = await this.getWorkspaceDashboardStatsUseCase.execute(workspace._id.toString());
      return ApiResposne.success(res, MESSAGES.SUCCESS.DASHBOARD_STATS_FETCHED, data);
    } catch (error) {
      next(error);
    }
  };

  getActiveUsers=async(req:AuthRequest,res:Response,next:NextFunction)=>{
    try {
      const workspaceId=req.params.workspaceId
      const activeUsercount=await this.getActiveUserUseCase.execute(workspaceId)

      return ApiResposne.success(res,"success",activeUsercount)
    } catch (error) {
      next(error)
    }
  }

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userEmail = req.user?.userEmail;
      const workspace = userEmail
        ? await this.workspaceRepository.findByAdminEmail(userEmail)
        : null;
      if (!workspace) {
        return res.status(404).json({ message: MESSAGES.ERRORS.WORKSPACE_ADMIN_NOT_FOUND });
      }
      return ApiResposne.success(res, "Profile fetched", {
        workspaceId: workspace._id.toString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const updateData = req.body;
      const updatedUser = await this.userRepository.updateUser(id, updateData);
      return ApiResposne.success(res, MESSAGES.SUCCESS.USER_UPDATED, updatedUser);
    } catch (error) {
      next(error);
    }
  };
}
