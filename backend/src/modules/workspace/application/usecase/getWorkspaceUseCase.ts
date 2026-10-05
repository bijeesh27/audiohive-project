import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";


export class GetWorkspaceUseCase implements IuseCase<string,IWorkspaceDocument>{
     constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}
    async execute(workspaceId:string): Promise<IWorkspaceDocument> {
        
        return await this.workspaceRepository.getWorkspaceById(workspaceId)   
    }
}