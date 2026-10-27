import { Types } from "mongoose";
import { IDirectMessageRepository } from "../domain/IDirectMessageRepository.js";
import { ConversationModel, IConversationDocument } from "./conversationSchema.js";
import { DirectMessageModel, IDirectMessageDocument } from "./directMessageSchema.js";
import { UserModel } from "../../../shared/User.utils/userSchema.js";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema.js";
import { OrganizationModel } from "../../organization/infrastructure/organizationSchema.js";
import { socketService } from "../../../socket/socketService.js";
import { GetDirectMessagesOptions, EligibleUserDTO } from "../application/dto/directMessageDTO.js";

export class DirectMessageRepository implements IDirectMessageRepository {
  async findOrCreateConversation(
    userId1: string,
    userId2: string,
    workspaceId?: string
  ): Promise<IConversationDocument> {
    const id1 = new Types.ObjectId(userId1);
    const id2 = new Types.ObjectId(userId2);

    let conv = await ConversationModel.findOne({
      participants: { $all: [id1, id2], $size: 2 },
    }).populate("participants", "_id username email role status");

    if (!conv) {
      const unreadMap = new Map<string, number>();
      unreadMap.set(userId1, 0);
      unreadMap.set(userId2, 0);

      conv = await ConversationModel.create({
        participants: [id1, id2],
        workspaceId: workspaceId ? new Types.ObjectId(workspaceId) : undefined,
        unreadCounts: unreadMap,
      });

      conv = await ConversationModel.findById(conv._id)
        .populate("participants", "_id username email role status")
        .exec();
    }

    return conv!;
  }

  async getUserConversations(userId: string): Promise<IConversationDocument[]> {
    const userObjId = new Types.ObjectId(userId);
    return await ConversationModel.find({
      participants: userObjId,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "_id username email role status")
      .exec();
  }

  async findConversationById(conversationId: string): Promise<IConversationDocument | null> {
    if (!Types.ObjectId.isValid(conversationId)) return null;
    return await ConversationModel.findById(conversationId)
      .populate("participants", "_id username email role status")
      .exec();
  }

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type?: "text" | "file" | "system";
  }): Promise<IDirectMessageDocument> {
    const message = await DirectMessageModel.create({
      conversationId: new Types.ObjectId(data.conversationId),
      senderId: new Types.ObjectId(data.senderId),
      receiverId: new Types.ObjectId(data.receiverId),
      content: data.content,
      type: data.type || "text",
      isRead: false,
    });

    const conv = await ConversationModel.findById(data.conversationId);
    if (conv) {
      conv.lastMessage = {
        content: data.content,
        senderId: new Types.ObjectId(data.senderId),
        createdAt: new Date(),
        type: data.type || "text",
      };

      const currentUnread = conv.unreadCounts.get(data.receiverId) || 0;
      conv.unreadCounts.set(data.receiverId, currentUnread + 1);
      conv.unreadCounts.set(data.senderId, 0);
      conv.markModified("unreadCounts");
      await conv.save();
    }

    return message;
  }

  async getMessages(
    conversationId: string,
    options: GetDirectMessagesOptions
  ): Promise<{ messages: IDirectMessageDocument[]; total: number; hasMore: boolean }> {
    const limit = options.limit ?? 50;
    const query: Record<string, any> = {
      conversationId: new Types.ObjectId(conversationId),
      isDeleted: false,
    };

    if (options.before) {
      query.createdAt = { $lt: new Date(options.before) };
    }

    const [messages, total] = await Promise.all([
      DirectMessageModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      DirectMessageModel.countDocuments({
        conversationId: new Types.ObjectId(conversationId),
        isDeleted: false,
      }),
    ]);

    return {
      messages: (messages as unknown as IDirectMessageDocument[]).reverse(),
      total,
      hasMore: messages.length === limit,
    };
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<number> {
    const convObjId = new Types.ObjectId(conversationId);
    const userObjId = new Types.ObjectId(userId);

    const updateRes = await DirectMessageModel.updateMany(
      {
        conversationId: convObjId,
        receiverId: userObjId,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    const conv = await ConversationModel.findById(conversationId);
    if (conv) {
      conv.unreadCounts.set(userId, 0);
      conv.markModified("unreadCounts");
      await conv.save();
    }

    return updateRes.modifiedCount;
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    return await DirectMessageModel.countDocuments({
      receiverId: new Types.ObjectId(userId),
      isRead: false,
      isDeleted: false,
    });
  }

  async verifyUsersCanMessage(
    userId1: string,
    userId2: string,
    currentWorkspaceId?: string
  ): Promise<boolean> {
    if (!userId1 || !userId2 || userId1 === userId2) return false;

    const [user1, user2] = await Promise.all([
      UserModel.findById(userId1),
      UserModel.findById(userId2),
    ]);

    if (!user1 || !user2 || !user1.status || !user2.status) return false;

    // Direct workspace membership check
    const u1Workspaces = [
      ...(user1.workspaceIds?.map((id) => id.toString()) || []),
      user1.workspaceId?.toString(),
      currentWorkspaceId,
    ].filter(Boolean) as string[];

    const u2Workspaces = [
      ...(user2.workspaceIds?.map((id) => id.toString()) || []),
      user2.workspaceId?.toString(),
    ].filter(Boolean) as string[];

    // Do they share any workspace?
    const sharesWorkspace = u1Workspaces.some((wId) => u2Workspaces.includes(wId));
    if (sharesWorkspace) return true;

    // Workspace Admin check
    const workspacesWhereU1IsAdmin = await WorkspaceModel.find({
      workspaceAdminEmail: user1.email,
    }).select("_id organizationId");

    const u1AdminWorkspaceIds = workspacesWhereU1IsAdmin.map((w) => w._id.toString());
    if (u2Workspaces.some((wId) => u1AdminWorkspaceIds.includes(wId))) return true;

    const workspacesWhereU2IsAdmin = await WorkspaceModel.find({
      workspaceAdminEmail: user2.email,
    }).select("_id organizationId");

    const u2AdminWorkspaceIds = workspacesWhereU2IsAdmin.map((w) => w._id.toString());
    if (u1Workspaces.some((wId) => u2AdminWorkspaceIds.includes(wId))) return true;

    // Organization owner check
    const org1 = await OrganizationModel.findOne({ ownerEmail: user1.email }).select("_id");
    if (org1) {
      const org1Workspaces = await WorkspaceModel.find({ organizationId: org1._id }).select("_id workspaceAdminEmail");
      const org1WorkspaceIds = org1Workspaces.map((w) => w._id.toString());
      const org1AdminEmails = org1Workspaces.map((w) => w.workspaceAdminEmail?.toLowerCase()).filter(Boolean);
      if (
        u2Workspaces.some((wId) => org1WorkspaceIds.includes(wId)) ||
        org1AdminEmails.includes(user2.email.toLowerCase())
      ) {
        return true;
      }
    }

    const org2 = await OrganizationModel.findOne({ ownerEmail: user2.email }).select("_id");
    if (org2) {
      const org2Workspaces = await WorkspaceModel.find({ organizationId: org2._id }).select("_id workspaceAdminEmail");
      const org2WorkspaceIds = org2Workspaces.map((w) => w._id.toString());
      const org2AdminEmails = org2Workspaces.map((w) => w.workspaceAdminEmail?.toLowerCase()).filter(Boolean);
      if (
        u1Workspaces.some((wId) => org2WorkspaceIds.includes(wId)) ||
        org2AdminEmails.includes(user1.email.toLowerCase())
      ) {
        return true;
      }
    }

    // Check shared organization via workspaces
    if (u1Workspaces.length > 0 && u2Workspaces.length > 0) {
      const [w1List, w2List] = await Promise.all([
        WorkspaceModel.find({ _id: { $in: u1Workspaces } }).select("organizationId"),
        WorkspaceModel.find({ _id: { $in: u2Workspaces } }).select("organizationId"),
      ]);
      const orgs1 = w1List.map((w) => w.organizationId?.toString()).filter(Boolean);
      const orgs2 = w2List.map((w) => w.organizationId?.toString()).filter(Boolean);
      if (orgs1.some((oId) => orgs2.includes(oId))) return true;
    }

    return false;
  }

  async searchEligibleUsers(
    userId: string,
    currentWorkspaceId?: string,
    searchQuery?: string
  ): Promise<EligibleUserDTO[]> {
    const user = await UserModel.findById(userId);
    if (!user) return [];

    const targetUserIds = new Set<string>();

    if (currentWorkspaceId && Types.ObjectId.isValid(currentWorkspaceId)) {
      const workspace = await WorkspaceModel.findById(currentWorkspaceId);
      if (workspace) {
        // Members assigned to this workspace
        const members = await UserModel.find({
          status: true,
          _id: { $ne: new Types.ObjectId(userId) },
          $or: [
            { workspaceIds: new Types.ObjectId(currentWorkspaceId) },
            { workspaceId: new Types.ObjectId(currentWorkspaceId) },
          ],
        }).select("_id");
        members.forEach((m) => targetUserIds.add(m._id.toString()));

        // Workspace admin
        if (workspace.workspaceAdminEmail) {
          const admin = await UserModel.findOne({
            email: workspace.workspaceAdminEmail,
            status: true,
            _id: { $ne: new Types.ObjectId(userId) },
          }).select("_id");
          if (admin) targetUserIds.add(admin._id.toString());
        }

        // Organization owner
        if (workspace.organizationId) {
          const org = await OrganizationModel.findById(workspace.organizationId);
          if (org?.ownerEmail) {
            const owner = await UserModel.findOne({
              email: org.ownerEmail,
              status: true,
              _id: { $ne: new Types.ObjectId(userId) },
            }).select("_id");
            if (owner) targetUserIds.add(owner._id.toString());
          }
        }
      }
    }

    // If user is organization owner or has organization
    const org = await OrganizationModel.findOne({ ownerEmail: user.email });
    if (org) {
      const orgWorkspaces = await WorkspaceModel.find({ organizationId: org._id }).select("_id workspaceAdminEmail");
      const orgWorkspaceIds = orgWorkspaces.map((w) => w._id);

      const orgMembers = await UserModel.find({
        status: true,
        _id: { $ne: new Types.ObjectId(userId) },
        $or: [
          { workspaceIds: { $in: orgWorkspaceIds } },
          { workspaceId: { $in: orgWorkspaceIds } },
        ],
      }).select("_id");
      orgMembers.forEach((m) => targetUserIds.add(m._id.toString()));

      const adminEmails = orgWorkspaces.map((w) => w.workspaceAdminEmail).filter(Boolean);
      if (adminEmails.length > 0) {
        const admins = await UserModel.find({
          email: { $in: adminEmails },
          status: true,
          _id: { $ne: new Types.ObjectId(userId) },
        }).select("_id");
        admins.forEach((a) => targetUserIds.add(a._id.toString()));
      }
    }

    if (targetUserIds.size === 0) return [];

    const filter: any = {
      _id: { $in: Array.from(targetUserIds).map((id) => new Types.ObjectId(id)) },
      status: true,
    };

    if (searchQuery && searchQuery.trim()) {
      const reg = new RegExp(searchQuery.trim(), "i");
      filter.$or = [{ username: reg }, { email: reg }];
    }

    const matchedUsers = await UserModel.find(filter)
      .select("_id username email role")
      .limit(30)
      .lean();

    return matchedUsers.map((u) => ({
      _id: u._id.toString(),
      username: u.username,
      email: u.email,
      role: u.role || "member",
      isOnline: socketService.isUserOnline(u._id.toString()),
    }));
  }
}
