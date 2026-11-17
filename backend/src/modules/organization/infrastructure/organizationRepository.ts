import { Types } from "mongoose";
import { BaseRepository } from "../../../shared/common/baseRepository";
import { CreateOrganizationDTO, GetOrganizationUsersResultDTO, OrganizationUserItemDTO } from "../application/dto/organizationDTO";
import { IorganizaionRepository, GetOrgUsersQueryOptions } from "../domain/IorganizationRepository";
import {
  ICreateOrganizationInvitation,
  InvitationModel,
} from "./organizationInvitationSchema";
import { IorganizationDocument, OrganizationModel } from "./organizationSchema";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema";
import { UserModel } from "../../../shared/User.utils/userSchema";
import { UserRoles } from "../../../common/constant/userRoles";
import { buildMultiWorkspaceMembershipQuery, SharedMetricsService } from "../../../shared/metrics/sharedMetricsService";
import { WORKSPACE_MEMBER_ROLES, getUserWorkspaceIds } from "../../../shared/User.utils/workspaceMembership";
import { RoomModel } from "../../room/infrastructure/roomSchema";
import { ActivityLogModel } from "../../activityLog/infrastructure/activitylogSchema";
import { SubscriptionModel } from "../../subscription/infrastructure/subscriptionSchema";
import { socketService } from "../../../socket/socketService";

export class OrganizationRepository
  extends BaseRepository<IorganizationDocument>
  implements IorganizaionRepository
{
  constructor() {
    super(OrganizationModel);
  }

  async createOrganization(
    data: CreateOrganizationDTO,
  ): Promise<IorganizationDocument> {
    return await this.create(data);
  }

  async updateOrganization(
    organizationId: string,
    data: Partial<IorganizationDocument>,
  ): Promise<void> {
    await this.update(organizationId, data);
  }

  async deleteOrganization(organizationId: string): Promise<void> {
    await this.delete(organizationId);
  }

  async getAllorganizations(
    page: number,
    limit: number,
    searchQuery?: string,
    sortOrder: string = "desc",
  ): Promise<{
    organizations: IorganizationDocument[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const query: FilterQuery<IorganizationDocument> = {};

    if (searchQuery) {
      query.$or = [
        {
          ownerEmail: {
            $regex: searchQuery,
            $options: "i",
          },
        },
        {
          companyName: {
            $regex: searchQuery,
            $options: "i",
          },
        },
      ];
    }

    const sortOpt = sortOrder === "asc" ? 1 : -1;

    const [organizations, total] = await Promise.all([
      OrganizationModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: sortOpt }),

      OrganizationModel.countDocuments(query),
    ]);

    return {
      organizations,
      total,
    };
  }

  async createInvitation(data: ICreateOrganizationInvitation): Promise<void> {
    await InvitationModel.create(data);
  }

  async findInvitationByToken(
    token: string,
  ): Promise<ICreateOrganizationInvitation | null> {
    return await InvitationModel.findOne({ token });
  }

  async findInvitationByEmail(
    ownerEmail: string,
  ): Promise<ICreateOrganizationInvitation | null> {
    return await InvitationModel.findOne({ ownerEmail });
  }

  async deleteInvitation(token: string): Promise<void> {
    await InvitationModel.deleteOne({ token });
  }

  async findByOwnerEmail(
    ownerEmail: string,
  ): Promise<IorganizationDocument | null> {
    return await OrganizationModel.findOne({ ownerEmail });
  }

  async getUsersByOrganization(
    organizationId: string,
    pageOrOptions?: number | GetOrgUsersQueryOptions,
    limitArg?: number,
    searchQueryArg?: string,
  ): Promise<GetOrganizationUsersResultDTO> {
    const options: GetOrgUsersQueryOptions =
      typeof pageOrOptions === "object" && pageOrOptions !== null
        ? pageOrOptions
        : {
            page: typeof pageOrOptions === "number" ? pageOrOptions : 1,
            limit: limitArg || 10,
            searchQuery: searchQueryArg,
          };

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const search = options.searchQuery?.trim();
    const workspaceIdFilter = options.workspaceId;
    const roleFilter = options.role;
    const statusFilter = options.status;
    const presenceFilter = options.presence;
    const sortField = options.sortField || "newest";
    const sortOrder = options.sortOrder || "desc";

    const allOrgWorkspaces = await WorkspaceModel.find({
      organizationId,
    })
      .select("_id workspaceName workspaceAdminEmail status")
      .lean();

    const allOrgWorkspaceIds = allOrgWorkspaces.map((w) => w._id.toString());
    const allOrgWorkspaceObjIds = allOrgWorkspaces.map((w) => w._id);

    // Filter workspaces if a specific workspaceId was requested
    let targetWorkspaceIds = allOrgWorkspaceIds;
    if (workspaceIdFilter && workspaceIdFilter !== "all") {
      targetWorkspaceIds = allOrgWorkspaceIds.filter((id) => id === workspaceIdFilter);
    }

    if (allOrgWorkspaceIds.length === 0 || targetWorkspaceIds.length === 0) {
      return {
        users: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
        metrics: {
          totalMembers: 0,
          planLimit: null,
        },
      };
    }

    // 1. Unified Members Metrics via SharedMetricsService
    const membersMetrics = await SharedMetricsService.getMembersMetrics(
      allOrgWorkspaceIds,
      allOrgWorkspaces.map((w) => ({ _id: w._id, workspaceName: w.workspaceName, status: w.status }))
    );

    // 2. Plan Limit from Organization Subscription
    const orgDoc = await OrganizationModel.findById(organizationId).lean();
    let planLimit: number | null = null;
    let planName: string | undefined = undefined;
    if (orgDoc?.planId && orgDoc.planId !== "free" && Types.ObjectId.isValid(orgDoc.planId)) {
      const plan = await SubscriptionModel.findById(orgDoc.planId).lean();
      if (plan) {
        planLimit = (plan as unknown as { maxUsers?: number })?.maxUsers ?? null;
        planName = plan.subscriptionName;
      }
    }
    if (!planName) {
      const freePlan =
        (await SubscriptionModel.findOne({ price: 0 }).lean()) ||
        (await SubscriptionModel.findOne({}).lean());
      if (freePlan) {
        planLimit = (freePlan as unknown as { maxUsers?: number })?.maxUsers ?? null;
        planName = freePlan.subscriptionName;
      }
    }

    // 3. Rooms & Activities for calculating roomsCount & lastActiveAt
    const [orgRooms, orgActivities] = await Promise.all([
      RoomModel.find({
        $or: [
          { workspaceId: { $in: allOrgWorkspaceIds } },
          { workspaceId: { $in: allOrgWorkspaceObjIds } },
        ],
      })
        .select("_id workspaceId type allowedUsers")
        .lean(),
      ActivityLogModel.find({
        $or: [
          { organizationId },
          { workspaceId: { $in: allOrgWorkspaceIds } },
        ],
      })
        .select("actorId occurredAt")
        .sort({ occurredAt: -1 })
        .lean(),
    ]);

    const lastActiveMap = new Map<string, Date>();
    for (const act of orgActivities) {
      const actorIdStr = act.actorId ? act.actorId.toString() : "";
      if (actorIdStr && !lastActiveMap.has(actorIdStr) && act.occurredAt) {
        lastActiveMap.set(actorIdStr, new Date(act.occurredAt));
      }
    }

    // 4. Build query
    const membershipFilter = buildMultiWorkspaceMembershipQuery(targetWorkspaceIds);
    const query: Record<string, unknown> = {
      role: { $in: WORKSPACE_MEMBER_ROLES },
      ...membershipFilter,
    };

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$and = [
        membershipFilter,
        {
          $or: [
            { username: searchRegex },
            { email: searchRegex },
          ],
        },
      ];
    }

    if (roleFilter && roleFilter !== "all") {
      const r = roleFilter.toLowerCase();
      if (r === "admin" || r === "workspaceadmin" || r === "workspace-admin") {
        query.role = { $in: ["workspaceadmin", "workspace-admin", "admin"] };
      } else if (r === "member") {
        query.role = "member";
      }
    }

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active") {
        query.status = { $ne: false };
      } else if (statusFilter === "disabled") {
        query.status = false;
      }
    }

    // Fetch candidate users
    const candidateUsers = await UserModel.find(query)
      .select("-password")
      .populate({
        path: "workspaceIds",
        select: "workspaceName organizationId",
      })
      .populate({
        path: "workspaceId",
        select: "workspaceName organizationId",
      })
      .lean();

    // Count admins per workspace across all organization members
    const workspaceAdminCounts = new Map<string, number>();
    for (const member of membersMetrics.allMembers) {
      const isAdm = member.role !== UserRoles.MEMBER;
      if (isAdm && member.status) {
        const mWsIds = [
          ...(member.workspaceIds || []),
          ...(member.workspaceId ? [member.workspaceId] : []),
        ];
        for (const wsId of mWsIds) {
          workspaceAdminCounts.set(wsId, (workspaceAdminCounts.get(wsId) || 0) + 1);
        }
      }
    }

    // 5. Transform and compute properties
    const mappedUsers: OrganizationUserItemDTO[] = [];

    for (const u of candidateUsers) {
      const userIdStr = u._id.toString();
      const isOnline = socketService.isUserOnline(userIdStr);

      // Presence filter
      if (presenceFilter === "online" && !isOnline) continue;
      if (presenceFilter === "offline" && isOnline) continue;

      // Filter user's workspaces to those belonging to this organization
      const userWorkspaces: Array<{ _id: string; workspaceName: string }> = [];
      const userRawWs = [
        ...(Array.isArray(u.workspaceIds) ? u.workspaceIds : []),
        ...(u.workspaceId ? [u.workspaceId] : []),
      ];

      const seenWsIds = new Set<string>();
      for (const item of userRawWs) {
        if (!item) continue;
        const wsObj = item as unknown as { _id?: Types.ObjectId | string; workspaceName?: string };
        const idStr = (wsObj._id || wsObj).toString();
        if (allOrgWorkspaceIds.includes(idStr) && !seenWsIds.has(idStr)) {
          seenWsIds.add(idStr);
          const matchedOrgWs = allOrgWorkspaces.find((w) => w._id.toString() === idStr);
          userWorkspaces.push({
            _id: idStr,
            workspaceName: wsObj.workspaceName || matchedOrgWs?.workspaceName || "Workspace",
          });
        }
      }

      // Accessible rooms count
      const accessibleRoomsCount = orgRooms.filter((room) => {
        const roomWsId = room.workspaceId?.toString();
        if (!seenWsIds.has(roomWsId)) return false;
        if (room.type === "public" || room.type === "lounge" || !room.type) return true;
        // private room
        const allowed = Array.isArray(room.allowedUsers)
          ? room.allowedUsers.map((a: unknown) => (a as Types.ObjectId).toString())
          : [];
        return allowed.includes(userIdStr);
      }).length;

      // Sole admin check
      const soleAdminWorkspaceNames: string[] = [];
      for (const wsInfo of userWorkspaces) {
        const wsData = allOrgWorkspaces.find((w) => w._id.toString() === wsInfo._id);
        const isDesignated = wsData?.workspaceAdminEmail?.toLowerCase() === u.email?.toLowerCase();
        const adminCount = workspaceAdminCounts.get(wsInfo._id) || 0;
        if (isDesignated || (u.role !== UserRoles.MEMBER && adminCount <= 1)) {
          soleAdminWorkspaceNames.push(wsInfo.workspaceName);
        }
      }

      const lastActive = lastActiveMap.get(userIdStr);
      const isOwner =
        u.email?.toLowerCase() === orgDoc?.ownerEmail?.toLowerCase() ||
        u.role === UserRoles.ORGANIZATION_OWNER;

      mappedUsers.push({
        _id: userIdStr,
        userId: userIdStr,
        username: u.username,
        email: u.email,
        role: u.role || UserRoles.MEMBER,
        status: u.status !== false,
        isOnline,
        roomsCount: accessibleRoomsCount,
        lastActiveAt: lastActive ? lastActive.toISOString() : null,
        joinedAt: (u as { createdAt?: Date }).createdAt
          ? new Date((u as { createdAt?: Date }).createdAt!).toISOString()
          : new Date().toISOString(),
        workspaceIds: userWorkspaces,
        workspaces: userWorkspaces,
        isSoleAdmin: soleAdminWorkspaceNames.length > 0,
        soleAdminWorkspaceNames,
        isOwner,
      });
    }

    // 6. Sort
    mappedUsers.sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.username.localeCompare(b.username);
        return sortOrder === "desc" ? -cmp : cmp;
      }
      if (sortField === "lastActive") {
        const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      }
      if (sortField === "joined") {
        const aTime = new Date(a.joinedAt).getTime();
        const bTime = new Date(b.joinedAt).getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      }
      // default: newest
      const aTime = new Date(a.joinedAt).getTime();
      const bTime = new Date(b.joinedAt).getTime();
      return bTime - aTime;
    });

    // 7. Paginate
    const total = mappedUsers.length;
    const startIndex = (page - 1) * limit;
    const pagedUsers = mappedUsers.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      users: pagedUsers,
      total,
      page,
      limit,
      totalPages,
      metrics: {
        totalMembers: membersMetrics.totalMembers,
        planLimit,
        planName,
      },
    };
  }

  async getTotalWorkspacesByOrg(organizationId: string): Promise<number> {
    return await WorkspaceModel.countDocuments({
      organizationId,
    });
  }

  async getTotalUsersByOrg(organizationId: string): Promise<number> {
    const workspaces = await WorkspaceModel.find({
      organizationId,
    }).select("_id");

    const stringIds = workspaces.map((w) => w._id.toString());
    if (stringIds.length === 0) return 0;

    return await UserModel.countDocuments({
      role: { $in: WORKSPACE_MEMBER_ROLES },
      ...buildMultiWorkspaceMembershipQuery(stringIds),
    });
  }
}
