import { Types } from "mongoose";
import { OrganizationNotFound } from "../../../../common/Errors/OrganizationError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { GetWorkspacesByOrgDTO, WorkspacesListOutputDTO, EnrichedWorkspaceDTO } from "../dto/workspaceDTOs";
import { SharedMetricsService, buildMultiWorkspaceMembershipQuery } from "../../../../shared/metrics/sharedMetricsService";
import { SubscriptionModel } from "../../../subscription/infrastructure/subscriptionSchema";
import { UserModel } from "../../../../shared/User.utils/userSchema";
import { RoomModel } from "../../../room/infrastructure/roomSchema";
import { ActivityLogModel } from "../../../activityLog/infrastructure/activitylogSchema";
import { socketService } from "../../../../socket/socketService";
import { WORKSPACE_MEMBER_ROLES } from "../../../../shared/User.utils/workspaceMembership";

export class GetWorkspacesByOrgUseCase implements IuseCase<GetWorkspacesByOrgDTO, WorkspacesListOutputDTO> {
    constructor(
        private readonly workspaceRepository: IworkspaceRepository,
        private readonly organizationRepository: IorganizaionRepository,
    ) {}

    async execute(data: GetWorkspacesByOrgDTO): Promise<WorkspacesListOutputDTO> {
        const organization = await this.organizationRepository.findByOwnerEmail(data.userEmail);
        if (!organization) {
            throw new OrganizationNotFound();
        }

        const orgIdStr = String(organization._id);

        // 1. Subscription & Plan limits
        let plan = null;
        if (organization.planId && organization.planId !== "free" && Types.ObjectId.isValid(organization.planId)) {
            plan = await SubscriptionModel.findById(organization.planId).lean();
        }
        if (!plan) {
            plan = (await SubscriptionModel.findOne({ price: 0 }).lean()) || (await SubscriptionModel.findOne({}).lean());
        }

        const maxWorkspacesLimit = plan?.maxWorkspaces ?? 5;
        const maxUsersLimit = (plan as unknown as { maxUsers?: number })?.maxUsers ?? null;

        // 2. Count total unfiltered workspaces to compute plan usage ("1 of 2 workspaces used")
        const { total: totalOrgWorkspaces } = await this.workspaceRepository.getWorkspacesByOrg(
            orgIdStr,
            1,
            1
        );
        const isLimitReached = maxWorkspacesLimit !== null && totalOrgWorkspaces >= maxWorkspacesLimit;

        // 3. Query workspaces matching filters (search, status, sort, page, limit)
        const page = Math.max(1, data.page || 1);
        const limit = Math.max(1, data.limit || 10);

        const { workspaces, total } = await this.workspaceRepository.getWorkspacesByOrg(
            orgIdStr,
            page,
            limit,
            data.search,
            data.status,
            data.sort
        );

        const now = new Date();
        const start30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // 4. Enrich workspaces with unified metrics from SharedMetricsService
        const enrichedWorkspaces: EnrichedWorkspaceDTO[] = await Promise.all(
            workspaces.map(async (ws: IWorkspaceDocument) => {
                const wsIdStr = ws._id.toString();
                const wsIdObj = Types.ObjectId.isValid(wsIdStr) ? new Types.ObjectId(wsIdStr) : ws._id;
                const wsIds = [wsIdStr, wsIdObj];

                // Members count & Online now
                const memberFilter = {
                    ...buildMultiWorkspaceMembershipQuery([ws._id]),
                    role: { $in: WORKSPACE_MEMBER_ROLES },
                };
                const memberUsers = await UserModel.find(memberFilter).select("_id email username role status").lean();
                const membersCount = memberUsers.length;

                let onlineNow = 0;
                for (const u of memberUsers) {
                    if (socketService.isUserOnline(u._id.toString())) {
                        onlineNow++;
                    }
                }

                // Rooms count (active rooms per unified definition)
                const roomWsMatch = Types.ObjectId.isValid(wsIdStr)
                    ? { $in: [wsIdStr, new Types.ObjectId(wsIdStr)] }
                    : wsIdStr;
                const roomsCount = await RoomModel.countDocuments({
                    workspaceId: roomWsMatch as unknown as Types.ObjectId,
                    status: "active",
                });

                // Meetings in last 30 days & Duration
                const meetingsMetrics = await SharedMetricsService.getMeetingsMetrics(
                    [wsIdStr],
                    start30d,
                    now
                );

                // Last activity
                const latestLog = await ActivityLogModel.findOne({
                    workspaceId: wsIdStr,
                })
                    .sort({ occurredAt: -1 })
                    .select("occurredAt action")
                    .lean();

                // Admin lookup: priority to workspaceAdminEmail, fallback to workspaceadmin member
                let adminName: string | undefined = undefined;
                let adminEmail: string | undefined = ws.workspaceAdminEmail || undefined;

                if (adminEmail) {
                    const adminUser = await UserModel.findOne({ email: adminEmail }).select("username email").lean();
                    if (adminUser) {
                        adminName = adminUser.username;
                    }
                }

                if (!adminName) {
                    const fallbackAdmin = memberUsers.find(
                        (u) => u.role === "workspaceadmin" || u.role === "workspace-admin"
                    );
                    if (fallbackAdmin) {
                        adminName = fallbackAdmin.username;
                        adminEmail = fallbackAdmin.email;
                    }
                }

                // Recent 5 activities for the drawer
                const recentLogs = await ActivityLogModel.find({
                    workspaceId: wsIdStr,
                })
                    .sort({ occurredAt: -1 })
                    .limit(5)
                    .lean();

                // Fetch actor names for recent logs
                const actorIds = recentLogs.map((l) => l.actorId).filter(Boolean) as string[];
                const actorUsers = actorIds.length > 0
                    ? await UserModel.find({ _id: { $in: actorIds } }).select("_id username email").lean()
                    : [];
                const actorNameMap = new Map(actorUsers.map((a) => [a._id.toString(), a.username]));

                const recentActivities = recentLogs.map((log) => ({
                    _id: log._id.toString(),
                    action: log.action,
                    actorName: (log.actorId && actorNameMap.get(log.actorId.toString())) || log.actorRole || "System",
                    occurredAt: log.occurredAt ? new Date(log.occurredAt).toISOString() : new Date().toISOString(),
                    details: (log.metadata?.details as string) || (log.metadata?.workspaceName as string) || undefined,
                }));

                return {
                    _id: wsIdStr,
                    workspaceName: ws.workspaceName,
                    slug: ws.slug,
                    status: ws.status,
                    workspaceAdminEmail: adminEmail,
                    workspaceAdminName: adminName,
                    description: ws.companyProfile?.about || "",
                    createdAt: ws.createdAt ? new Date(ws.createdAt).toISOString() : new Date().toISOString(),
                    updatedAt: ws.updatedAt ? new Date(ws.updatedAt).toISOString() : new Date().toISOString(),
                    membersCount,
                    membersLimit: maxUsersLimit,
                    roomsCount,
                    onlineNow,
                    lastActivityAt: latestLog?.occurredAt ? new Date(latestLog.occurredAt).toISOString() : null,
                    meetingsCount30d: meetingsMetrics.meetingsConducted,
                    meetingDuration30d: meetingsMetrics.formattedDuration,
                    recentActivities,
                };
            })
        );

        // If sort by 'members' was requested, sort in-memory
        if (data.sort === "members") {
            enrichedWorkspaces.sort((a, b) => b.membersCount - a.membersCount);
        }

        const totalPages = Math.max(1, Math.ceil(total / limit));

        return {
            workspaces: enrichedWorkspaces,
            total,
            page,
            limit,
            totalPages,
            planUsage: {
                current: totalOrgWorkspaces,
                max: maxWorkspacesLimit,
                isLimitReached,
            },
        };
    }
}
