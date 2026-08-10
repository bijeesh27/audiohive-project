import { MESSAGES } from "../../../../common/constant/messages";
import { CreateWorkspaceError } from "../../../../common/Errors/WorkspaceError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { createWorkspaceDTO } from "../dto/workspaceDTOs";

export class CreateWorkspaceUseCase implements IuseCase<createWorkspaceDTO,void>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}
    async execute(data?: createWorkspaceDTO): Promise<void> {
        if (!data){
            throw new CreateWorkspaceError(MESSAGES.ERRORS.WORKSPACE_INVALID_DATA)
        }
        await this.workspaceRepository.createWorkspace(data as unknown as IWorkspaceDocument);
    }
}