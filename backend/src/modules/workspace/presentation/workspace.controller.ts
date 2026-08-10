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
        private readonly getAllWorkspacesUseCase: GetAllWorkspacesUseCase
    ) {}

    async createWorkspace(req: Request, res: Response, next: NextFunction) {
        let response=await this.createWorkspaceUseCase.execute(req.body);
        return ApiResposne.success(res,MESSAGES.SUCCESS.WORSPACE_CREATED,response,HttpStatus.CREATED)
    }

    async updateWorkspace(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id as string;
        const response=await this.updateWorkspaceUseCase.execute({ id, ...req.body });
        return ApiResposne.success(res,MESSAGES.SUCCESS.WORKSPACE_UPDATED,response,HttpStatus.OK)
    }

    async deleteWorkspace(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id as string;
        const response=await this.deleteWorkspaceUseCase.execute({ workspaceId: id });
        return ApiResposne.success(res,MESSAGES.SUCCESS.WORKSPACE_DELETED,response)
    }

    async getAllWorkspaces(req: Request, res: Response, next: NextFunction) {
        const workspaces = await this.getAllWorkspacesUseCase.execute();
        return ApiResposne.success(res,MESSAGES.SUCCESS.WORKSPACE_GET_ALL,workspaces)
    
    }
}