import { createOrganizationDTO } from "../application/dto/organizationDTO";
import { IorganizationDocument } from "../infrastructure/organizationSchema";

export interface IorganizaionRepository{
    createOrganization(data:createOrganizationDTO):Promise<IorganizationDocument>
    updateOrganization(organizationId:string,data:Partial<IorganizationDocument>):Promise<void>
    deleteOrganization(organizationId:string):Promise<void>
    getAllorganizations():Promise<IorganizationDocument[]>
}