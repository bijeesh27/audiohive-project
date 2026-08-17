import { IInvitationDocument } from "../infrastructure/invitationSchema";
import { IWorkspaceDocument } from "../infrastructure/workspaceSchema";


export interface IworkspaceRepository{
    createWorkspace(data:IWorkspaceDocument):Promise<void>
    updateWorkspace(workspaceId:string,date:Partial<IWorkspaceDocument>):Promise<void>
    deleteWorkspace(workspaceId:string):Promise<void>
    getAllWorkspaces(page: number, limit: number, search?: string): Promise<{ workspaces: IWorkspaceDocument[]; total: number }>
    getWorkspacesByOrg(organizationId: string, page: number, limit: number, search?: string): Promise<{ workspaces: IWorkspaceDocument[]; total: number }>
    createInvitation(data:IInvitationDocument):Promise<void>
    findInvitationByToken(token: string): Promise<IInvitationDocument | null>
    updateInvitation(token: string, data: Partial<IInvitationDocument>): Promise<void>
}