import { BaseRepository } from "../../../shared/common/baseRepository";
import { IworkspaceRepository } from "../domain/IworkspaceRepository";
import { IInvitationDocument, InvitationModel } from "./invitationSchema";
import { IWorkspaceDocument, WorkspaceModel } from "./workspaceSchema";

export class WorkspaceReopsitory extends BaseRepository<IWorkspaceDocument> implements IworkspaceRepository{
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
async getAllWorkspaces(page: number, limit: number, search?: string) {
  const query = search 
    ? { companyName: { $regex: search, $options: "i" } } 
    : {};

  const workspaces = await this.model
    .find(query)
    .populate("planId")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await this.model.countDocuments(query);

  return { workspaces, total };
}
 async createInvitation(data: IInvitationDocument): Promise<void> {
     await InvitationModel.create(data)
 }


 
}