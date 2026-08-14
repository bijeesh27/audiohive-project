import { NextFunction, Request, Response } from "express";
import { CreateWorkspaceUseCase } from "../application/usecase/createWorkspaceUseCase";
import { updateWorkspaceUsecase } from "../application/usecase/updateWorkspaceUseCase";
import { DeleteWorkspaceUseCase } from "../application/usecase/deleteWorkspaceUseCase";
import { GetAllWorkspacesUseCase } from "../application/usecase/getAllWorkspacesUseCase";
import { ApiResposne } from "../../../common/Response/Response";
import { MESSAGES } from "../../../common/constant/messages";
import { HttpStatus } from "../../../common/constant/httpStatus";


export class WorkspaceController {
  constructor(
    private readonly createWorkspaceUseCase: CreateWorkspaceUseCase,
    private readonly updateWorkspaceUseCase: updateWorkspaceUsecase,
    private readonly deleteWorkspaceUseCase: DeleteWorkspaceUseCase,
    private readonly getAllWorkspacesUseCase: GetAllWorkspacesUseCase,
  ) {}

  async createWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.createWorkspaceUseCase.execute(req.body);
      return ApiResposne.success(
        res,
        MESSAGES.SUCCESS.WORSPACE_CREATED,
        response,
        HttpStatus.CREATED,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const response = await this.updateWorkspaceUseCase.execute({
        id,
        ...req.body,
      });
      return ApiResposne.success(
        res,
        MESSAGES.SUCCESS.WORKSPACE_UPDATED,
        response,
        HttpStatus.OK,
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const response = await this.deleteWorkspaceUseCase.execute({
        workspaceId: id,
      });
      return ApiResposne.success(
        res,
        MESSAGES.SUCCESS.WORKSPACE_DELETED,
        response,
      );
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
}
