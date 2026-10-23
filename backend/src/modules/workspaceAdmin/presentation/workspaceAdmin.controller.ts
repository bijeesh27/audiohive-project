import { NextFunction, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";
import { AuthRequest } from "../../../middleware/authMiddleware.ts";
import { SendUserInvitationDTO, GetAllUsersQueryDTO, WorkspaceDashboardStatsDTO } from "../application/dtos/workspaceAdminDTO.ts";
import { AccessDeniedError } from "../../../common/Errors/AuthError.ts";
import { ResolveWorkspaceDTO, ResolvedWorkspaceDTO } from "../../workspace/application/dto/workspaceDTOs.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { UpdateWorkspaceMemberInput } from "../application/usecase/updateWorkspaceMemberUseCase.ts";
import { RemoveWorkspaceMemberInput } from "../application/usecase/removeWorkspaceMemberUseCase.ts";
import { AppError } from "../../../common/Errors/AppError.ts";
import { HttpStatus } from "../../../common/constant/httpStatus.ts";

export class WorkspaceAdminController {
  constructor(
    private readonly getAllUserUseCase: IuseCase<GetAllUsersQueryDTO, { users: IuserDTO[]; total: number } | null>,
    private readonly sendUserInvitationUseCase: IuseCase<SendUserInvitationDTO, void>,
    private readonly getWorkspaceDashboardStatsUseCase: IuseCase<string, WorkspaceDashboardStatsDTO>,
    private readonly resolveWorkspaceUseCase: IuseCase<ResolveWorkspaceDTO, ResolvedWorkspaceDTO>,
    private readonly getActiveUserUseCase: IuseCase<string, number>,
    private readonly updateWorkspaceMemberUseCase: IuseCase<UpdateWorkspaceMemberInput, IuserDTO>,
    private readonly removeWorkspaceMemberUseCase: IuseCase<RemoveWorkspaceMemberInput, IuserDTO>
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
      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: req.user?.userEmail,
        role: UserRoles.WORKSPACE_ADMIN,
      });
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
      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: req.user?.userEmail,
        role: UserRoles.WORKSPACE_ADMIN,
      });

      if (updateData.workspaceId === null && Object.keys(updateData).length === 1) {
        const removedUser = await this.removeWorkspaceMemberUseCase.execute({
          userId: id,
          workspaceId,
        });
        return ApiResposne.success(res, MESSAGES.SUCCESS.USER_UPDATED, removedUser);
      }

      if (typeof updateData.status !== "boolean" || Object.keys(updateData).some((key) => key !== "status")) {
        throw new AppError(MESSAGES.ERRORS.ONLY_MEMBER_STATUS_CAN_BE_CHANGED, HttpStatus.BAD_REQUEST);
      }

      const updatedUser = await this.updateWorkspaceMemberUseCase.execute({
        userId: id,
        workspaceId,
        status: updateData.status,
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.USER_UPDATED, updatedUser);
    } catch (error) {
      next(error);
    }
  };
}


