import { BaseRepository } from "../../../shared/common/baseRepository";
import { createOrganizationDTO } from "../application/dto/organizationDTO";
import { IorganizaionRepository } from "../domain/IorganizationRepository";
import { ICreateOrganizationInvitation, InvitationModel } from "./organizationInvitationSchema";
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
  async getAllorganizations(
  page: number,
  limit: number,
  searchQuery?: string,
  sortOrder: string = 'desc'
): Promise<{ organizations: IorganizationDocument[], total: number }> {
  const skip = (page - 1) * limit;

  const query: any = {};

  if (searchQuery) {
    query.$or = [
      { ownerEmail: { $regex: searchQuery, $options: "i" } },
      { companyName: { $regex: searchQuery, $options: "i" } },
    ];
  }

  const sortOpt = sortOrder === 'asc' ? 1 : -1;

  const [organizations, total] = await Promise.all([
    OrganizationModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: sortOpt }),
    OrganizationModel.countDocuments(query)
  ]);

  return { organizations, total };
}
   async createInvitation(data: ICreateOrganizationInvitation): Promise<void> {
       await InvitationModel.create(data)
   }

   async findInvitationByToken(token: string): Promise<ICreateOrganizationInvitation | null> {
       return await InvitationModel.findOne({ token })
   }

   async deleteInvitation(token: string): Promise<void> {
       await InvitationModel.deleteOne({ token })
   }

   async findByOwnerEmail(ownerEmail: string): Promise<IorganizationDocument | null> {
       return await OrganizationModel.findOne({ ownerEmail })
   }
}
