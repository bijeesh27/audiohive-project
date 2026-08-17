import { Types } from "mongoose";


export interface createOrganizationDTO {
  companyName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
}
export interface updateOrganizationDTO{
    companyName?: string;
      slug?: string;
      ownerId?: Types.ObjectId;
      planId?: Types.ObjectId;
      maxWorkspaces?: number;
}

