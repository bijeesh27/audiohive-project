import mongoose, { ClientSession, Types } from "mongoose";
import { BaseRepository } from "../../../shared/common/baseRepository";
import { IworkspaceRepository } from "../domain/IworkspaceRepository";
import { IInvitationDocument, InvitationModel } from "./invitationSchema";
import { ICompanyProfile, IWorkspaceAnnouncement, IWorkspaceDocument, WorkspaceModel } from "./workspaceSchema";
import { IRoomDocument, RoomModel } from "../../room/infrastructure/roomSchema";

export class WorkspaceReopsitory extends BaseRepository<IWorkspaceDocument> implements IworkspaceRepository{
    constructor(){
        super(WorkspaceModel)
    }
 async createWorkspace(data: Partial<IWorkspaceDocument>, session?: ClientSession): Promise<IWorkspaceDocument> {
    if (session) {
      const created = await this.model.create([data as IWorkspaceDocument], { session });
      return created[0];
    }
    return (await this.create(data)) as IWorkspaceDocument;
 }

 async createWorkspaceWithLounge(
    workspaceData: Partial<IWorkspaceDocument>,
    adminUserId?: string
 ): Promise<{ workspace: IWorkspaceDocument; lounge: IRoomDocument }> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const createdWorkspaces = await this.model.create([workspaceData as IWorkspaceDocument], { session });
      const workspace = createdWorkspaces[0];

      const creatorId = adminUserId && Types.ObjectId.isValid(adminUserId)
        ? new Types.ObjectId(adminUserId)
        : new Types.ObjectId();

      const createdRooms = await RoomModel.create(
        [
          {
            organizationId: workspace.organizationId,
            workspaceId: workspace._id,
            name: "Lounge",
            description: "The workspace lounge - hang out, listen to music, and catch up with your team.",
            type: "lounge",
            isDefault: true,
            isPrivate: false,
            status: "active",
            capacity: 100,
            settings: {
              music: {
                enabled: true,
              },
            },
            allowedUsers: [],
            createdBy: creatorId,
          },
        ],
        { session }
      );
      const lounge = createdRooms[0];

      await session.commitTransaction();
      return { workspace, lounge };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
 }
 async updateWorkspace(workspaceId:string,data: Partial<IWorkspaceDocument>): Promise<void> {
     await this.update(workspaceId,data)
 }
 async deleteWorkspace(workspaceId: string): Promise<void> {
     await this.delete(workspaceId)
 }
 async getAllWorkspaces(page: number, limit: number, search?: string) {
  const query = search 
    ? { companyName: { $regex: search, $options: "i" } } 
    : {};

  const workspaces = await this.model
    .find(query)
    .populate("planId")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await this.model.countDocuments(query);

  return { workspaces, total };
}

 async getWorkspacesByOrg(
  organizationId: string,
  page: number,
  limit: number,
  search?: string,
  status?: string,
  sort?: string
 ) {
  const query: Record<string, unknown> = { organizationId };

  if (status && status !== "all") {
    query.status = status;
  }

  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { workspaceName: { $regex: term, $options: "i" } },
      { slug: { $regex: term, $options: "i" } },
      { workspaceAdminEmail: { $regex: term, $options: "i" } },
    ];
  }

  let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === "oldest") {
    sortQuery = { createdAt: 1 };
  } else if (sort === "name") {
    sortQuery = { workspaceName: 1 };
  }

  const workspaces = await this.model
    .find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort(sortQuery);

  const total = await this.model.countDocuments(query);

  return { workspaces, total };
}

 async getWorkspacesByIds(workspaceIds: string[], activeOnly = false): Promise<IWorkspaceDocument[]> {
  if (workspaceIds.length === 0) return [];

  const query: Record<string, unknown> = { _id: { $in: workspaceIds } };
  if (activeOnly) query.status = "active";

  return await this.model.find(query).sort({ workspaceName: 1 });
 }
 async createInvitation(data: IInvitationDocument): Promise<void> {
     await InvitationModel.create(data)
   }

   async findInvitationByToken(token: string): Promise<IInvitationDocument | null> {
     return await InvitationModel.findOne({ token });
   }

   async updateInvitation(token: string, data: Partial<IInvitationDocument>): Promise<void> {
     await InvitationModel.updateOne({ token }, data);
   }

   async getWorkspaceById(workspaceId: string): Promise<IWorkspaceDocument | null> {
     return await this.findById(workspaceId);
   }

   async findByAdminEmail(email: string): Promise<IWorkspaceDocument | null> {
     return await this.model.findOne({ workspaceAdminEmail: email });
   }

   async getCompanyProfile(workspaceId: string): Promise<ICompanyProfile | null> {
     const ws = await this.model.findById(workspaceId).select("companyProfile workspaceName");
     if (!ws) return null;
     return (
       ws.companyProfile || {
         name: ws.workspaceName,
         tagline: "",
         about: "",
         mission: "",
         website: "",
         logoUrl: "",
         links: [],
         announcements: [],
       }
     );
   }

   async updateCompanyProfile(
     workspaceId: string,
     profile: Partial<ICompanyProfile>
   ): Promise<ICompanyProfile | null> {
     const updateFields: Record<string, unknown> = {};
     if (profile.name !== undefined) updateFields["companyProfile.name"] = profile.name;
     if (profile.tagline !== undefined) updateFields["companyProfile.tagline"] = profile.tagline;
     if (profile.about !== undefined) updateFields["companyProfile.about"] = profile.about;
     if (profile.mission !== undefined) updateFields["companyProfile.mission"] = profile.mission;
     if (profile.website !== undefined) updateFields["companyProfile.website"] = profile.website;
     if (profile.logoUrl !== undefined) updateFields["companyProfile.logoUrl"] = profile.logoUrl;
     if (profile.links !== undefined) updateFields["companyProfile.links"] = profile.links;

     const updated = await this.model.findByIdAndUpdate(
       workspaceId,
       { $set: updateFields },
       { new: true }
     );
     return updated?.companyProfile || null;
   }

   async addAnnouncement(
     workspaceId: string,
     announcement: { title: string; body: string; createdBy: string }
   ): Promise<IWorkspaceAnnouncement | null> {
     const newAnnouncement: IWorkspaceAnnouncement = {
       _id: new Types.ObjectId(),
       title: announcement.title,
       body: announcement.body,
       createdAt: new Date(),
       createdBy: announcement.createdBy,
     };

     const updated = await this.model.findByIdAndUpdate(
       workspaceId,
       {
         $push: {
           "companyProfile.announcements": {
             $each: [newAnnouncement],
             $position: 0,
           },
         },
       },
       { new: true }
     );

     if (!updated) return null;
     return newAnnouncement;
   }
}
