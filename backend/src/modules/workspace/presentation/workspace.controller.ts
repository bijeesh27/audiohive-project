import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response";
import { MESSAGES } from "../../../common/constant/messages";
import { HttpStatus } from "../../../common/constant/httpStatus";
import { IuseCase } from "../../../shared/interface/IuseCase";
import { createWorkspaceDTO, deleteWorkspaceDTO, updateWorkspaceDTO } from "../application/dto/workspaceDTOs";
import { IWorkspaceDocument } from "../infrastructure/workspaceSchema";
import { AuthRequest } from "../../../middleware/authMiddleware";

export class WorkspaceController {
  constructor(
    private readonly createWorkspaceUseCase: IuseCase<createWorkspaceDTO, void>,
    private readonly updateWorkspaceUseCase: IuseCase<updateWorkspaceDTO, void>,
    private readonly deleteWorkspaceUseCase: IuseCase<deleteWorkspaceDTO, void>,
    private readonly getAllWorkspacesUseCase: IuseCase<
      { page: number; limit: number; search?: string },
      { workspaces: IWorkspaceDocument[]; total: number }
    >,
    private readonly getWorkspacesByOrgUseCase: IuseCase<
      { userEmail: string; page: number; limit: number; search?: string },
      { workspaces: IWorkspaceDocument[]; total: number }
    >,
    private readonly sendWorkspaceInvitationUseCase: IuseCase<
      { workspaceId: string; email: string; workspaceAdminName: string; organizationOwnerEmail: string },
      void
    >,
  ) {}

  async createWorkspace(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user?.userEmail;
      if (!userEmail) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized: missing user info" });
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
      return ApiResposne.success(res, "Workspaces retrieved", data);
    } catch (error) {
      next(error);
    }
  }

  async getMyWorkspaces(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user?.userEmail;
      if (!userEmail) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const data = await this.getWorkspacesByOrgUseCase.execute({ userEmail, page, limit, search });
      return ApiResposne.success(res, "Workspaces retrieved", data);
    } catch (error) {
      next(error);
    }
  }

  async inviteWorkspaceAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user?.userEmail;
      if (!userEmail) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
      }

      const workspaceId = req.params.id;
      const { email, workspaceAdminName } = req.body;

      await this.sendWorkspaceInvitationUseCase.execute({
        workspaceId,
        email,
        workspaceAdminName,
        organizationOwnerEmail: userEmail,
      });

      return ApiResposne.success(res, "Invitation sent successfully");
    } catch (error) {
      next(error);
    }
  }
}
