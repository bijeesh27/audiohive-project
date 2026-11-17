import { ClientSession } from "mongoose";
import { IInvitationDocument } from "../infrastructure/invitationSchema";
import { ICompanyProfile, IWorkspaceAnnouncement, IWorkspaceDocument } from "../infrastructure/workspaceSchema";
import { IRoomDocument } from "../../room/infrastructure/roomSchema";

export interface IworkspaceRepository {
  createWorkspace(data: Partial<IWorkspaceDocument>, session?: ClientSession): Promise<IWorkspaceDocument>;
  createWorkspaceWithLounge(
    workspaceData: Partial<IWorkspaceDocument>,
    adminUserId?: string
  ): Promise<{ workspace: IWorkspaceDocument; lounge: IRoomDocument }>;
  updateWorkspace(workspaceId: string, data: Partial<IWorkspaceDocument>): Promise<void>;
  deleteWorkspace(workspaceId: string): Promise<void>;
  getAllWorkspaces(page: number, limit: number, search?: string): Promise<{ workspaces: IWorkspaceDocument[]; total: number }>;
  getWorkspacesByOrg(organizationId: string, page: number, limit: number, search?: string, status?: string, sort?: string): Promise<{ workspaces: IWorkspaceDocument[]; total: number }>;
  getWorkspacesByIds(workspaceIds: string[], activeOnly?: boolean): Promise<IWorkspaceDocument[]>;
  createInvitation(data: IInvitationDocument): Promise<void>;
  findInvitationByToken(token: string): Promise<IInvitationDocument | null>;
  updateInvitation(token: string, data: Partial<IInvitationDocument>): Promise<void>;
  getWorkspaceById(workspaceId: string): Promise<IWorkspaceDocument | null>;
  findByAdminEmail(email: string): Promise<IWorkspaceDocument | null>;
  getCompanyProfile(workspaceId: string): Promise<ICompanyProfile | null>;
  updateCompanyProfile(workspaceId: string, profile: Partial<ICompanyProfile>): Promise<ICompanyProfile | null>;
  addAnnouncement(workspaceId: string, announcement: { title: string; body: string; createdBy: string }): Promise<IWorkspaceAnnouncement | null>;
}
