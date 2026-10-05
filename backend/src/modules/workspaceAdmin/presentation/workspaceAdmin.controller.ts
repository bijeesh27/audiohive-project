import { NextFunction, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";
import { AuthRequest } from "../../../middleware/authMiddleware.ts";
import { SendUserInvitationDTO } from "../application/usecase/sendUserInvitationUseCase.ts";
import { AccessDeniedError } from "../../../common/Errors/AuthError.ts";
import { ResolveWorkspaceDTO, ResolvedWorkspaceResult } from "../../workspace/application/usecases/resolveWorkspaceUseCase.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";

export class WorkspaceAdminController {
  constructor(
    private readonly getAllUserUseCase: IuseCase<{ workspaceId: string; page: number; limit: number,search?: string }, { users: IuserDocument[]; total: number } | null>,
    private readonly sendUserInvitationUseCase: IuseCase<SendUserInvitationDTO, void>,
    private readonly getWorkspaceDashboardStatsUseCase: IuseCase<string, { totalRooms: number; totalUsers: number }>,
    private readonly resolveWorkspaceUseCase: IuseCase<ResolveWorkspaceDTO, ResolvedWorkspaceResult>,
    private readonly getActiveUserUseCase: IuseCase<string, number>,
    private readonly updateUserUseCase: IuseCase<{ userId: string, updateData: Partial<IuserDocument> }, IuserDocument>
  ) {}

  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      
      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: req.user?.userEmail,
        role: UserRoles.WORKSPACE_ADMIN
      });

      const data = await this.getAllUserUseCase.execute({ workspaceId, page, limit, search });
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

      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: workspaceAdminEmail,
        role: UserRoles.WORKSPACE_ADMIN
      });

      const { email, invitedName, role } = req.body;
      
      await this.sendUserInvitationUseCase.execute({
        workspaceId,
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
      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: req.user?.userEmail,
        role: UserRoles.WORKSPACE_ADMIN
      });
      const data = await this.getWorkspaceDashboardStatsUseCase.execute(workspaceId);
      return ApiResposne.success(res, MESSAGES.SUCCESS.DASHBOARD_STATS_FETCHED, data);
    } catch (error) {
      next(error);
    }
  };

  getActiveUsers=async(req:AuthRequest,res:Response,next:NextFunction)=>{
    try {
      const workspaceId = req.params.workspaceId as string;
      const activeUsercount = await this.getActiveUserUseCase.execute(workspaceId);

      return ApiResposne.success(res, MESSAGES.SUCCESS.ACTIVE_USERS_FETCHED, activeUsercount)
    } catch (error) {
      next(error)
    }
  }

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: req.user?.userEmail,
        role: UserRoles.WORKSPACE_ADMIN
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.PROFILE_FETCHED, {
        workspaceId,
      });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const updateData = req.body;
      const updatedUser = await this.updateUserUseCase.execute({ userId: id, updateData });
      return ApiResposne.success(res, MESSAGES.SUCCESS.USER_UPDATED, updatedUser);
    } catch (error) {
      next(error);
    }
  };
}
