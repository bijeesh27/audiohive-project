import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { GetWorkspaceDTO } from "../dto/workspaceDTOs";


export class GetWorkspaceUseCase implements IuseCase<GetWorkspaceDTO,IWorkspaceDocument | null>{
     constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}
    async execute(data: GetWorkspaceDTO): Promise<IWorkspaceDocument | null> {
        
        return await this.workspaceRepository.getWorkspaceById(data.workspaceId)
    }
}
