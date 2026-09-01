import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";


export class GetWorkspaceUseCase implements IuseCase<string,IWorkspaceDocument>{
     constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}
    async execute(workspaceId:string): Promise<any> {
        console.log('hi')
        console.log(workspaceId)
        return await this.workspaceRepository.getWorkspaceById(workspaceId)   
    }
}