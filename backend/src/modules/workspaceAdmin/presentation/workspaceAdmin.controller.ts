import { NextFunction, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";
import { AuthRequest } from "../../../middleware/authMiddleware.ts";
import {
  SendUserInvitationDTO,
  GetAllUsersQueryDTO,
  GetAllUsersResponseDTO,
  WorkspaceDashboardStatsDTO,
} from "../application/dtos/workspaceAdminDTO.ts";
import { AccessDeniedError } from "../../../common/Errors/AuthError.ts";
import { ResolveWorkspaceDTO, ResolvedWorkspaceDTO } from "../../workspace/application/dto/workspaceDTOs.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { UpdateWorkspaceMemberInput } from "../application/usecase/updateWorkspaceMemberUseCase.ts";
import { RemoveWorkspaceMemberInput } from "../application/usecase/removeWorkspaceMemberUseCase.ts";
import { AppError } from "../../../common/Errors/AppError.ts";
import { HttpStatus } from "../../../common/constant/httpStatus.ts";
import {
  GetWorkspaceUserAnalyticsInputDTO,
  WorkspaceUserAnalyticsResponseDTO,
  GetUserActivityHistoryInputDTO,
  UserActivityHistoryResponseDTO,
} from "../application/dtos/workspaceUserAnalyticsDTO.ts";
import {
  GetWorkspaceDashboardInputDTO,
  WorkspaceDashboardResponseDTO,
  GetWorkspaceMembersActivityInputDTO,
  WorkspaceMembersActivityResponseDTO,
} from "../application/dtos/workspaceDashboardDTO.ts";

export class WorkspaceAdminController {
  constructor(
    private readonly getAllUserUseCase: IuseCase<GetAllUsersQueryDTO, GetAllUsersResponseDTO | null>,
    private readonly sendUserInvitationUseCase: IuseCase<SendUserInvitationDTO, void>,
    private readonly getWorkspaceDashboardStatsUseCase: IuseCase<string, WorkspaceDashboardStatsDTO>,
    private readonly resolveWorkspaceUseCase: IuseCase<ResolveWorkspaceDTO, ResolvedWorkspaceDTO>,
    private readonly getActiveUserUseCase: IuseCase<string, number>,
    private readonly updateWorkspaceMemberUseCase: IuseCase<UpdateWorkspaceMemberInput, IuserDTO>,
    private readonly removeWorkspaceMemberUseCase: IuseCase<RemoveWorkspaceMemberInput, IuserDTO>,
    private readonly getWorkspaceUserAnalyticsUseCase?: IuseCase<GetWorkspaceUserAnalyticsInputDTO, WorkspaceUserAnalyticsResponseDTO>,
    private readonly getUserActivityHistoryUseCase?: IuseCase<GetUserActivityHistoryInputDTO, UserActivityHistoryResponseDTO>,
    private readonly getWorkspaceDashboardUseCase?: IuseCase<GetWorkspaceDashboardInputDTO, WorkspaceDashboardResponseDTO>,
    private readonly getWorkspaceMembersActivityUseCase?: IuseCase<GetWorkspaceMembersActivityInputDTO, WorkspaceMembersActivityResponseDTO>
  ) {}

  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;
      const sortField = req.query.sortField as string | undefined;
      const sortOrder = req.query.sortOrder as ("asc" | "desc") | undefined;
      
      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: req.user?.userEmail,
        role: UserRoles.WORKSPACE_ADMIN
      });

      const data = await this.getAllUserUseCase.execute({
        workspaceId,
        page,
        limit,
        search,
        role,
        status,
        sortField,
        sortOrder,
      });
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
      const adminEmail = req.user?.userEmail;
      const adminId = req.user?.id;

      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: adminEmail,
        role: UserRoles.WORKSPACE_ADMIN,
      });

      // Self-protection: Admin cannot disable, modify role, or remove their own account
      if (adminId && id === adminId) {
        throw new AppError("You cannot modify or remove your own workspace admin account", HttpStatus.FORBIDDEN);
      }

      if (updateData.workspaceId === null && Object.keys(updateData).length === 1) {
        const removedUser = await this.removeWorkspaceMemberUseCase.execute({
          userId: id,
          workspaceId,
        });
        return ApiResposne.success(res, MESSAGES.SUCCESS.USER_UPDATED, removedUser);
      }

      const hasStatus = updateData.status !== undefined;
      const hasRole = updateData.role !== undefined;

      if (!hasStatus && !hasRole) {
        throw new AppError("Only status or role can be updated", HttpStatus.BAD_REQUEST);
      }

      const updatedUser = await this.updateWorkspaceMemberUseCase.execute({
        userId: id,
        workspaceId,
        status: hasStatus ? updateData.status : undefined,
        role: hasRole ? updateData.role : undefined,
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.USER_UPDATED, updatedUser);
    } catch (error) {
      next(error);
    }
  };

  getUserAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const adminEmail = req.user?.userEmail;
      if (!adminEmail || !this.getWorkspaceUserAnalyticsUseCase) {
        throw new AccessDeniedError();
      }

      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: adminEmail,
        role: UserRoles.WORKSPACE_ADMIN,
      });

      const range = req.query.range as "today" | "7d" | "30d" | "custom" | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const data = await this.getWorkspaceUserAnalyticsUseCase.execute({
        workspaceId,
        adminEmail,
        range,
        startDate,
        endDate,
        search,
        page,
        limit,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.USER_ANALYTICS_RETRIEVED, data);
    } catch (error) {
      next(error);
    }
  };

  getUserActivityHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const adminEmail = req.user?.userEmail;
      const userId = req.params.userId as string;
      if (!adminEmail || !userId || !this.getUserActivityHistoryUseCase) {
        throw new AccessDeniedError();
      }

      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: adminEmail,
        role: UserRoles.WORKSPACE_ADMIN,
      });

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 15;

      const data = await this.getUserActivityHistoryUseCase.execute({
        workspaceId,
        userId,
        adminEmail,
        page,
        limit,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.USER_ACTIVITY_HISTORY_RETRIEVED, data);
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const adminEmail = req.user?.userEmail;
      if (!adminEmail || !this.getWorkspaceDashboardUseCase) {
        throw new AccessDeniedError();
      }

      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: adminEmail,
        role: UserRoles.WORKSPACE_ADMIN,
      });

      const range = (req.query.range as "today" | "7d" | "30d" | "custom") || "7d";
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const data = await this.getWorkspaceDashboardUseCase.execute({
        workspaceId,
        adminEmail,
        range,
        startDate,
        endDate,
      });

      return ApiResposne.success(res, "Workspace dashboard data retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  };

  getMembersActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const adminEmail = req.user?.userEmail;
      if (!adminEmail || !this.getWorkspaceMembersActivityUseCase) {
        throw new AccessDeniedError();
      }

      const { workspaceId } = await this.resolveWorkspaceUseCase.execute({
        userEmail: adminEmail,
        role: UserRoles.WORKSPACE_ADMIN,
      });

      const range = (req.query.range as "today" | "7d" | "30d" | "custom") || "7d";
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const search = req.query.search as string | undefined;
      const status = req.query.status as "all" | "active" | "disabled" | undefined;
      const sortField = req.query.sortField as "logins" | "meetings" | "duration" | "rooms" | "actions" | "name" | "lastActive" | undefined;
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const data = await this.getWorkspaceMembersActivityUseCase.execute({
        workspaceId,
        adminEmail,
        range,
        startDate,
        endDate,
        search,
        status,
        sortField,
        sortOrder,
        page,
        limit,
      });

      return ApiResposne.success(res, "Workspace members activity retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  };
}


