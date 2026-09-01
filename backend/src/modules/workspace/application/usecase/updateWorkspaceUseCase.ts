import { MESSAGES } from "../../../../common/constant/messages";
import { CreateWorkspaceError } from "../../../../common/Errors/WorkspaceError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { updateWorkspaceDTO } from "../dto/workspaceDTOs";

export class updateWorkspaceUsecase implements IuseCase<updateWorkspaceDTO,void>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}
    async execute(data?: updateWorkspaceDTO & { id: string }): Promise<void> {
        if (!data || !data.id) throw new CreateWorkspaceError(MESSAGES.ERRORS.WORKSPACE_INVALID_ID)
        const { id, ...updateData } = data;
        try {
            await this.workspaceRepository.updateWorkspace(id, updateData as Partial<IWorkspaceDocument>);
        } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
                throw new CreateWorkspaceError("Workspace slug is already in use");
            }
            throw error;
        }
    }
}