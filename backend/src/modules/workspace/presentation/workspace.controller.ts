import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response";
import { MESSAGES } from "../../../common/constant/messages";
import { HttpStatus } from "../../../common/constant/httpStatus";
import { IuseCase } from "../../../shared/interface/IuseCase";
import {
  CreateWorkspaceDTO,
  DeleteWorkspaceDTO,
  GetWorkspaceDTO,
  GetWorkspaceUsersDTO,
  GetWorkspacesByOrgDTO,
  RemoveWorkspaceUserDTO,
  SendWorkspaceInvitationDTO,
  UpdateWorkspaceDTO,
  WorkspacePaginationDTO,
} from "../application/dto/workspaceDTOs";
import { IWorkspaceDocument } from "../infrastructure/workspaceSchema";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { IuserDTO } from "../../../shared/User.utils/userDTO";
import { AppError } from "../../../common/Errors/AppError";
import { GetMemberWorkspacesInput } from "../application/usecase/getMemberWorkspacesUseCase";

export class WorkspaceController {
  constructor(
    private readonly createWorkspaceUseCase: IuseCase<CreateWorkspaceDTO, void>,
    private readonly updateWorkspaceUseCase: IuseCase<UpdateWorkspaceDTO, void>,
    private readonly deleteWorkspaceUseCase: IuseCase<DeleteWorkspaceDTO, void>,
    private readonly getWorkspaceUseCase: IuseCase<GetWorkspaceDTO, IWorkspaceDocument | null>,
    private readonly getAllWorkspacesUseCase: IuseCase<
      WorkspacePaginationDTO,
      { workspaces: IWorkspaceDocument[]; total: number }
    >,
    private readonly getWorkspacesByOrgUseCase: IuseCase<
      GetWorkspacesByOrgDTO,
      { workspaces: IWorkspaceDocument[]; total: number }
    >,
    private readonly sendWorkspaceInvitationUseCase: IuseCase<SendWorkspaceInvitationDTO, void>,
    private readonly getWorkspaceUsersUseCase: IuseCase<
      GetWorkspaceUsersDTO,
      { users: IuserDTO[]; total: number } | null
    >,
    private readonly removeWorkspaceUserUseCase: IuseCase<RemoveWorkspaceUserDTO, IuserDTO>,
    private readonly getMemberWorkspacesUseCase: IuseCase<GetMemberWorkspacesInput, IWorkspaceDocument[]>
  ) {}

  async createWorkspace(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user?.userEmail;
      if (!userEmail) {
        throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      await this.createWorkspaceUseCase.execute({
        userEmail,
        workspaceName: req.body.workspaceName,
        slug: req.body.slug,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.WORSPACE_CREATED, undefined, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const response = await this.updateWorkspaceUseCase.execute({ id, ...req.body });
      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_UPDATED, response, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const response = await this.deleteWorkspaceUseCase.execute({ workspaceId: id });
      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_DELETED, response);
    } catch (error) {
      next(error);
    }
  }

  async getAllWorkspaces(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const data = await this.getAllWorkspacesUseCase.execute({ page, limit, search });
      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_GET_ALL, data);
    } catch (error) {
      next(error);
    }
  }

  async getMyWorkspaces(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user?.userEmail;
      if (!userEmail) {
        throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const data = await this.getWorkspacesByOrgUseCase.execute({ userEmail, page, limit, search });
      return ApiResposne.success(res,MESSAGES.SUCCESS.WORKSPACE_GET_ALL, data);
    } catch (error) {
      next(error);
    }
  }

  async inviteWorkspaceAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user?.userEmail;
      if (!userEmail) {
        throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      const workspaceId = req.params.id as string;
      const { email, workspaceAdminName } = req.body;

      await this.sendWorkspaceInvitationUseCase.execute({
        workspaceId,
        email,
        workspaceAdminName,
        organizationOwnerEmail: userEmail,
      });

      return ApiResposne.success(res,MESSAGES.SUCCESS.INVITATION_SEND);
    } catch (error) {
      next(error);
    }
  }
  async getWorkspace(req:Request,res:Response,next:NextFunction){
    try {
      const workspaceId=req.params.id as string
      const workspace= await this.getWorkspaceUseCase.execute({ workspaceId })
      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_FETCHED, workspace)
    } catch (error) {
      next(error)
    }
  }

  async getWorkspaceUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.id as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const ownerEmail = req.user?.userEmail;
      if (!ownerEmail) throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);

      const data = await this.getWorkspaceUsersUseCase.execute({ workspaceId, ownerEmail, page, limit, search });
      return ApiResposne.success(res, MESSAGES.SUCCESS.USERS_FETCHED, data);
    } catch (error) {
      next(error);
    }
  }

  async removeWorkspaceUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.id as string;
      const userId = req.params.userId as string;

      const ownerEmail = req.user?.userEmail;
      const actorId = req.user?.id;
      if (!ownerEmail || !actorId) {
        throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      const data = await this.removeWorkspaceUserUseCase.execute({ workspaceId, userId, ownerEmail, actorId });
      return ApiResposne.success(res, MESSAGES.SUCCESS.USER_REMOVED_FROM_WORKSPACE, data);
    } catch (error) {
      next(error);
    }
  }

  async getMemberWorkspaces(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      const workspaces = await this.getMemberWorkspacesUseCase.execute({ userId: req.user.id });
      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_GET_ALL, { workspaces });
    } catch (error) {
      next(error);
    }
  }
}
