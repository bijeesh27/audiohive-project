import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";

export class GetAllWorkspacesUseCase implements IuseCase<{ page: number; limit: number; search?: string }, 
  { workspaces: IWorkspaceDocument[]; total: number }>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}

    async execute(data: { page: number; limit: number; search?: string }) {
    return await this.workspaceRepository.getAllWorkspaces(
      data.page, 
      data.limit, 
      data.search
    );
  }
  
}
