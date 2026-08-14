import { Types } from "mongoose";


export interface createOrganizationDTO{
    companyName: string;
      slug: string;
      ownerId: Types.ObjectId;
      planId: Types.ObjectId;
      maxWorkspaces: number;
}
export interface updateOrganizationDTO{
    companyName?: string;
      slug?: string;
      ownerId?: Types.ObjectId;
      planId?: Types.ObjectId;
      maxWorkspaces?: number;
}

