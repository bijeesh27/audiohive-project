import { MESSAGES } from "../../../../common/constant/messages";
import { CreateWorkspaceError } from "../../../../common/Errors/WorkspaceError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { deleteWorkspaceDTO } from "../dto/workspaceDTOs";

export class DeleteWorkspaceUseCase implements IuseCase<deleteWorkspaceDTO,void>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}

    async execute(data?: deleteWorkspaceDTO): Promise<void> {
        if (!data || !data.workspaceId) throw new CreateWorkspaceError(MESSAGES.ERRORS.WORKSPACE_INVALID_ID)
        await this.workspaceRepository.deleteWorkspace(data.workspaceId);
    }
}