import { IInvitationDocument } from "../infrastructure/invitationSchema";
import { IWorkspaceDocument } from "../infrastructure/workspaceSchema";


export interface IworkspaceRepository{
    createWorkspace(data:IWorkspaceDocument):Promise<void>
    updateWorkspace(workspaceId:string,date:Partial<IWorkspaceDocument>):Promise<void>
    deleteWorkspace(workspaceId:string):Promise<void>
    getAllWorkspaces():Promise<IWorkspaceDocument[]>
    createInvitation(data:IInvitationDocument):Promise<void>
}