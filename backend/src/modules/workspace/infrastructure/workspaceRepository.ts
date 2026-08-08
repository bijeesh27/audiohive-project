import { BaseRepository } from "../../../shared/common/baseRepository";
import { IworkspaceRepository } from "../domain/IworkspaceRepository";
import { IWorkspaceDocument, WorkspaceModel } from "./workspaceSchema";

export class workspaceReopsitory extends BaseRepository<IWorkspaceDocument> implements IworkspaceRepository{
    constructor(){
        super(WorkspaceModel)
    }
 async createWorkspace(data: IWorkspaceDocument): Promise<void> {
    await this.create(data)
 }
 async updateWorkspace(workspaceId:string,data: Partial<IWorkspaceDocument>): Promise<void> {
     await this.update(workspaceId,data)
 }
 async deleteWorkspace(workspaceId: string): Promise<void> {
     await this.delete(workspaceId)
 }
 async getAllWorkspaces(): Promise<IWorkspaceDocument[]> {
     const allWorkspace=await WorkspaceModel.find()
     return allWorkspace
 }
}