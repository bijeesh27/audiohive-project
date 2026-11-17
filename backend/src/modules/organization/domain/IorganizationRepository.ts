import { IuserDocument } from "../../../shared/User.utils/userSchema";
import { CreateOrganizationDTO, GetOrganizationUsersResultDTO } from "../application/dto/organizationDTO";
import { ICreateOrganizationInvitation } from "../infrastructure/organizationInvitationSchema";
import { IorganizationDocument } from "../infrastructure/organizationSchema";

export interface GetOrgUsersQueryOptions {
    page?: number;
    limit?: number;
    searchQuery?: string;
    workspaceId?: string;
    role?: string;
    status?: string;
    presence?: string;
    sortField?: string;
    sortOrder?: "asc" | "desc";
}

export interface IorganizaionRepository{
    createOrganization(data:CreateOrganizationDTO):Promise<IorganizationDocument>
    updateOrganization(organizationId:string,data:Partial<IorganizationDocument>):Promise<void>
    deleteOrganization(organizationId:string):Promise<void>
    getAllorganizations(page: number, limit: number,searchQuery?:string, sortOrder?: string):Promise<{ organizations: IorganizationDocument[], total: number }>
    createInvitation(data:ICreateOrganizationInvitation):Promise<void>
    findInvitationByToken(token: string): Promise<ICreateOrganizationInvitation | null>
    findInvitationByEmail(email: string): Promise<ICreateOrganizationInvitation | null>
    deleteInvitation(token: string): Promise<void>
    findByOwnerEmail(ownerEmail:string):Promise<IorganizationDocument | null>
    getUsersByOrganization(
        organizationId: string,
        pageOrOptions?: number | GetOrgUsersQueryOptions,
        limit?: number,
        searchQuery?: string
    ): Promise<GetOrganizationUsersResultDTO>;
    getTotalWorkspacesByOrg(organizationId: string): Promise<number>;
    getTotalUsersByOrg(organizationId: string): Promise<number>;
}
