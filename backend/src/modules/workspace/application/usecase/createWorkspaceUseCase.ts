import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { createWorkspaceDTO } from "../dto/workspaceDTOs";

export class CreateWorkspaceUseCase implements IuseCase<createWorkspaceDTO,void>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}
    async execute(data:IWorkspaceDocument): Promise<void> {
        await this.workspaceRepository.createWorkspace(data)
    }
}