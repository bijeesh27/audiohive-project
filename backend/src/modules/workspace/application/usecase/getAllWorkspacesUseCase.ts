import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";

export class GetAllWorkspacesUseCase implements IuseCase<void, IWorkspaceDocument[]>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}

    async execute(): Promise<IWorkspaceDocument[]> {
        return await this.workspaceRepository.getAllWorkspaces()
    }
}
