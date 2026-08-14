import { BaseRepository } from "../../../shared/common/baseRepository";
import { createOrganizationDTO } from "../application/dto/organizationDTO";
import { IorganizaionRepository } from "../domain/IorganizationRepository";
import { IorganizationDocument, OrganizationModel } from "./organizationSchema";

export class OrganizationRepository extends BaseRepository<IorganizationDocument> implements IorganizaionRepository  {
    constructor(){
        super(OrganizationModel)
    }
  async createOrganization(data: createOrganizationDTO): Promise<IorganizationDocument> {
    return await this.create(data)
  }
  async updateOrganization(organizationId: string, data: Partial<IorganizationDocument>): Promise<void> {
       await this.update(organizationId,data)
  }
  async deleteOrganization(organizationId: string): Promise<void> {
      await this.delete(organizationId)
  }
  async getAllorganizations(): Promise<IorganizationDocument[]> {
      const organizations =await OrganizationModel.find()
      return organizations
  }
}
