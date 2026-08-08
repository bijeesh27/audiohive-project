import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { updateWorkspaceDTO } from "../dto/workspaceDTOs";

export class updateWorkspaceUsecase implements IuseCase<updateWorkspaceDTO,void>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}
    async execute(workspaceId:string,data?: IWorkspaceDocument): Promise<void> {
        await this.workspaceRepository.updateWorkspace(workspaceId,data)
    }
}