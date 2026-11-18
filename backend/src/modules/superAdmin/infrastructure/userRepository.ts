import { Types } from "mongoose";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import { IuserDocument, UserModel } from "../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../domain/IuserRepository.ts";
import { OrganizationModel } from "../../organization/infrastructure/organizationSchema.ts";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema.ts";
import { ActivityLogModel } from "../../activityLog/infrastructure/activitylogSchema.ts";
import { socketService } from "../../../socket/socketService.ts";
import { getUserWorkspaceIds } from "../../../shared/User.utils/workspaceMembership.ts";
import { AppError } from "../../../common/Errors/AppError.ts";
import { HttpStatus } from "../../../common/constant/httpStatus.ts";
import {
  GetSuperAdminUsersFilterDTO,
  SuperAdminUsersResponseDTO,
  SuperAdminUserItemDTO,
  UpdateUserStatusDTO,
} from "../application/dtos/SuperAdminUsersDTO.ts";

export class UserRepository implements IuserRepository {
  /**
   * Comprehensive Platform Users query for Super Admin portal.
   * Resolves organizations, workspaces, presence, and last active activity for all users.
   */
  async getSuperAdminUsers(
    filter: GetSuperAdminUsersFilterDTO
  ): Promise<SuperAdminUsersResponseDTO> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));

    // Fetch supporting reference collections
    const [allOrganizations, allWorkspaces, allActivityLogs] = await Promise.all([
      OrganizationModel.find({ status: { $ne: "archived" } })
        .select("_id companyName slug ownerEmail ownerName")
        .lean(),
      WorkspaceModel.find({ status: { $ne: "archived" } })
        .select("_id workspaceName organizationId workspaceAdminEmail")
        .lean(),
      ActivityLogModel.find({})
        .sort({ occurredAt: -1 })
        .select("actorId occurredAt")
        .lean(),
    ]);

    // Fast lookups
    const orgById = new Map<string, { _id: string; companyName: string; slug: string; ownerEmail: string }>();
    const orgByOwnerEmail = new Map<string, { _id: string; companyName: string; slug: string }>();
    for (const org of allOrganizations) {
      const idStr = org._id.toString();
      const orgInfo = {
        _id: idStr,
        companyName: org.companyName,
        slug: org.slug,
        ownerEmail: org.ownerEmail?.toLowerCase() || "",
      };
      orgById.set(idStr, orgInfo);
      if (org.ownerEmail) {
        orgByOwnerEmail.set(org.ownerEmail.toLowerCase(), {
          _id: idStr,
          companyName: org.companyName,
          slug: org.slug,
        });
      }
    }

    const wsById = new Map<string, { _id: string; workspaceName: string; organizationId?: string; workspaceAdminEmail?: string }>();
    for (const ws of allWorkspaces) {
      wsById.set(ws._id.toString(), {
        _id: ws._id.toString(),
        workspaceName: ws.workspaceName,
        organizationId: ws.organizationId ? ws.organizationId.toString() : undefined,
        workspaceAdminEmail: ws.workspaceAdminEmail?.toLowerCase(),
      });
    }

    // Last activity per actor
    const lastActivityByActor = new Map<string, Date>();
    for (const log of allActivityLogs) {
      if (log.actorId) {
        const actorKey = log.actorId.toString();
        if (!lastActivityByActor.has(actorKey)) {
          lastActivityByActor.set(actorKey, new Date(log.occurredAt));
        }
      }
    }

    // Base query for users
    const query: Record<string, unknown> = {};

    // Role filter
    if (filter.role && filter.role !== "all") {
      query.role = filter.role.toLowerCase();
    }

    // Status filter
    if (filter.status === "active") {
      query.status = true;
    } else if (filter.status === "disabled") {
      query.status = false;
    }

    // Search query on username or email
    if (filter.search && filter.search.trim()) {
      const s = filter.search.trim();
      query.$or = [
        { username: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
      ];
    }

    // Workspace filter
    if (filter.workspaceId && filter.workspaceId !== "all") {
      try {
        const wsObjId = new Types.ObjectId(filter.workspaceId);
        query.$or = [
          { workspaceIds: wsObjId },
          { workspaceIds: filter.workspaceId },
          { workspaceId: wsObjId },
          { workspaceId: filter.workspaceId },
        ];
      } catch {
        query.workspaceIds = filter.workspaceId;
      }
    }

    // Retrieve matching user documents
    const rawUsers = await UserModel.find(query).select("-password").lean();

    // Enrich and transform each user
    const enrichedUsers: SuperAdminUserItemDTO[] = [];

    for (const user of rawUsers) {
      const userIdStr = user._id ? user._id.toString() : "";
      const emailLower = user.email ? user.email.toLowerCase() : "";
      const userWsIds = getUserWorkspaceIds(user);

      // Resolve Workspaces
      const resolvedWorkspaces: Array<{ _id: string; workspaceName: string }> = [];
      let resolvedOrg: { _id: string; companyName: string; slug: string } | null = null;

      for (const wsId of userWsIds) {
        const ws = wsById.get(wsId);
        if (ws) {
          resolvedWorkspaces.push({
            _id: ws._id,
            workspaceName: ws.workspaceName,
          });
          if (!resolvedOrg && ws.organizationId && orgById.has(ws.organizationId)) {
            const o = orgById.get(ws.organizationId)!;
            resolvedOrg = { _id: o._id, companyName: o.companyName, slug: o.slug };
          }
        }
      }

      // Check if user owns an organization directly
      const isOwnerByEmail = orgByOwnerEmail.has(emailLower);
      const isOwner = isOwnerByEmail || user.role === UserRoles.ORGANIZATION_OWNER;
      if (isOwnerByEmail && !resolvedOrg) {
        resolvedOrg = orgByOwnerEmail.get(emailLower) || null;
      }

      // Check if sole admin
      const isWsAdmin =
        user.role === UserRoles.WORKSPACE_ADMIN ||
        user.role === "workspace-admin" ||
        user.role === "admin";
      const soleAdminWsNames: string[] = [];
      if (isWsAdmin) {
        for (const wsId of userWsIds) {
          const ws = wsById.get(wsId);
          if (ws && ws.workspaceAdminEmail === emailLower) {
            soleAdminWsNames.push(ws.workspaceName);
          }
        }
      }

      // Presence
      const isOnline = socketService.isUserOnline(userIdStr);

      // Last Active
      let lastActiveAt: string | null = null;
      if (lastActivityByActor.has(userIdStr)) {
        lastActiveAt = lastActivityByActor.get(userIdStr)!.toISOString();
      } else if ((user as { updatedAt?: Date }).updatedAt) {
        lastActiveAt = new Date((user as { updatedAt: Date }).updatedAt).toISOString();
      }

      const joinedAt = (user as { createdAt?: Date }).createdAt
        ? new Date((user as { createdAt: Date }).createdAt).toISOString()
        : new Date().toISOString();

      enrichedUsers.push({
        _id: userIdStr,
        userId: userIdStr,
        username: user.username,
        email: user.email,
        role: user.role || "member",
        status: user.status !== false,
        isOnline,
        lastActiveAt,
        joinedAt,
        organization: resolvedOrg,
        workspaces: resolvedWorkspaces,
        isOwner,
        isSoleAdmin: soleAdminWsNames.length > 0,
        soleAdminWorkspaceNames: soleAdminWsNames,
      });
    }

    // Filter in-memory for fields dependent on enrichment:
    let filteredList = enrichedUsers;

    // Organization filter
    if (filter.organizationId && filter.organizationId !== "all") {
      filteredList = filteredList.filter(
        (u) => u.organization && u.organization._id === filter.organizationId
      );
    }

    // Presence filter
    if (filter.presence === "online") {
      filteredList = filteredList.filter((u) => u.isOnline);
    } else if (filter.presence === "offline") {
      filteredList = filteredList.filter((u) => !u.isOnline);
    }

    // Calculate Platform User Stats (platform-wide from enriched pool)
    const nonSuperAdmins = enrichedUsers.filter((u) => u.role !== UserRoles.SUPER_ADMIN);
    const totalUsers = nonSuperAdmins.length;
    const ownersCount = nonSuperAdmins.filter((u) => u.isOwner || u.role === UserRoles.ORGANIZATION_OWNER).length;
    const membersCount = totalUsers - ownersCount;
    const onlineCount = enrichedUsers.filter((u) => u.isOnline).length;

    // Sorting
    const sortField = filter.sort || "newest";
    filteredList.sort((a, b) => {
      if (sortField === "name") {
        return a.username.localeCompare(b.username);
      }
      if (sortField === "oldest") {
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      }
      if (sortField === "lastActive") {
        const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return timeB - timeA;
      }
      // default "newest"
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    });

    const total = filteredList.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredList.slice(startIndex, startIndex + limit);

    return {
      users: paginatedUsers,
      total,
      page,
      limit,
      totalPages,
      stats: {
        totalUsers,
        ownersCount,
        membersCount,
        onlineCount,
      },
      filterOptions: {
        organizations: allOrganizations.map((o) => ({
          _id: o._id.toString(),
          companyName: o.companyName,
          slug: o.slug,
        })),
        workspaces: allWorkspaces.map((w) => ({
          _id: w._id.toString(),
          workspaceName: w.workspaceName,
          organizationId: w.organizationId ? w.organizationId.toString() : undefined,
        })),
      },
    };
  }

  /**
   * Safely updates user status with safeguards and audit logging.
   */
  async updateUserStatus(dto: UpdateUserStatusDTO): Promise<{ success: boolean; status: boolean }> {
    const { targetUserId, status, actorId, actorEmail } = dto;

    // Guard: Prevent disabling self
    if (targetUserId === actorId) {
      throw new AppError("You cannot disable your own Super Admin account.", HttpStatus.BAD_REQUEST);
    }

    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("User not found.", HttpStatus.NOT_FOUND);
    }

    // Guard: Prevent modifying another superadmin
    if (targetUser.role === UserRoles.SUPER_ADMIN) {
      throw new AppError("Super Admin accounts cannot have their status altered here.", HttpStatus.FORBIDDEN);
    }

    // Guard: Prevent disabling an active Organization Owner
    if (status === false) {
      const isOwnerRole = targetUser.role === UserRoles.ORGANIZATION_OWNER;
      const ownsOrg = await OrganizationModel.findOne({
        ownerEmail: targetUser.email,
        status: { $ne: "archived" },
      });
      if (isOwnerRole || ownsOrg) {
        throw new AppError(
          `Cannot disable the owner of organization "${ownsOrg?.companyName || "Organization"}". Reassign organization ownership before disabling this user.`,
          HttpStatus.FORBIDDEN
        );
      }
    }

    const previousStatus = targetUser.status !== false;
    targetUser.status = status;
    await targetUser.save();

    // Write audit log
    await ActivityLogModel.create({
      occurredAt: new Date(),
      action: status ? "ENABLE_USER" : "DISABLE_USER",
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorName: "Super Admin",
      actorEmail: actorEmail,
      targetType: "USER",
      targetId: targetUserId,
      metadata: {
        targetUsername: targetUser.username,
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
        previousStatus,
        newStatus: status,
      },
    });

    return { success: true, status };
  }

  /**
   * Legacy compatibility method
   */
  async getAllUsers(
    page: number,
    limit: number,
    searchQuery?: string
  ): Promise<{ users: Array<IuserDocument>; total: number } | null> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (searchQuery && searchQuery.trim()) {
      query.$or = [
        { username: { $regex: searchQuery.trim(), $options: "i" } },
        { email: { $regex: searchQuery.trim(), $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      UserModel.find(query).select("-password").skip(skip).limit(limit),
      UserModel.countDocuments(query),
    ]);

    return { users, total };
  }

  async getTotalOrganizations(): Promise<number> {
    return await OrganizationModel.countDocuments({ status: { $ne: "archived" } });
  }

  async getTotalUsers(): Promise<number> {
    return await UserModel.countDocuments({
      role: { $in: [UserRoles.ORGANIZATION_OWNER, UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER] },
    });
  }
}
