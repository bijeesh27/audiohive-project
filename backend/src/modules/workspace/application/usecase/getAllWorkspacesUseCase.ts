import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { WorkspacePaginationDTO } from "../dto/workspaceDTOs";

export class GetAllWorkspacesUseCase implements IuseCase<WorkspacePaginationDTO,
  { workspaces: IWorkspaceDocument[]; total: number }>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository
    ){}

    async execute(data: WorkspacePaginationDTO) {
    return await this.workspaceRepository.getAllWorkspaces(
      data.page, 
      data.limit, 
      data.search
    );
  }
  
}
