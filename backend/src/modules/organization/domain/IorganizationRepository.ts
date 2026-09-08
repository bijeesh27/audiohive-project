import { IuserDocument } from "../../../shared/User.utils/userSchema";
import { createOrganizationDTO } from "../application/dto/organizationDTO";
import { ICreateOrganizationInvitation } from "../infrastructure/organizationInvitationSchema";
import { IorganizationDocument } from "../infrastructure/organizationSchema";

export interface IorganizaionRepository{
    createOrganization(data:createOrganizationDTO):Promise<IorganizationDocument>
    updateOrganization(organizationId:string,data:Partial<IorganizationDocument>):Promise<void>
    deleteOrganization(organizationId:string):Promise<void>
    getAllorganizations(page: number, limit: number,searchQuery?:string, sortOrder?: string):Promise<{ organizations: IorganizationDocument[], total: number }>
    createInvitation(data:ICreateOrganizationInvitation):Promise<void>
    findInvitationByToken(token: string): Promise<ICreateOrganizationInvitation | null>
    deleteInvitation(token: string): Promise<void>
    findByOwnerEmail(ownerEmail:string):Promise<IorganizationDocument | null>
    getUsersByOrganization(
        organizationId: string,
        page: number,
        limit: number,
        searchQuery?: string
    ): Promise<{ users: IuserDocument[], total: number }>;
    getTotalWorkspacesByOrg(organizationId: string): Promise<number>;
    getTotalUsersByOrg(organizationId: string): Promise<number>;
}