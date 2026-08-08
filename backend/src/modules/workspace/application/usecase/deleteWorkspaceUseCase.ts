import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { deleteWorkspaceDTO } from "../dto/workspaceDTOs";

export class DeleteWorkspaceUseCase implements IuseCase<deleteWorkspaceDTO,void>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}

    async execute(workspaceId:string): Promise<void> {
        await this.workspaceRepository.deleteWorkspace(workspaceId)
    }
}