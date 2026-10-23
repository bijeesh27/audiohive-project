import { BaseRepository } from "../../../shared/common/baseRepository";
import { ActivityLogInputDTO } from "../application/dto/activityLogDTO";
import { ActivityLogQueryOptions, EnrichedActivityLog, IactivityLogRepository, PaginatedActivityLogs } from "../domain/IactivitylogRepository";
import { ActivityLogModel, IActivityLogDocumet } from "./activitylogSchema";
import { UserModel } from "../../../shared/User.utils/userSchema";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema";
import { OrganizationModel } from "../../organization/infrastructure/organizationSchema";

export class ActivityLogRepository extends BaseRepository<IActivityLogDocumet> implements IactivityLogRepository{
    constructor(){
        super(ActivityLogModel)
    }

    async recordActivity(data:ActivityLogInputDTO): Promise<void> {
        await this.model.create(data)
    }

    private async buildSearchFilter(search?: string): Promise<Record<string, any>> {
        if (!search || !search.trim()) return {};

        const searchTrimmed = search.trim();
        const searchRegex = { $regex: searchTrimmed, $options: "i" };

        const matchingUsers = await UserModel.find(
            {
                $or: [
                    { username: searchRegex },
                    { email: searchRegex },
                ],
            },
            { _id: 1 }
        ).lean();

        const actorIds = matchingUsers.map((u: any) => u._id.toString());

        const orConditions: any[] = [
            { action: searchRegex },
            { actorRole: searchRegex },
            { targetType: searchRegex },
        ];

        if (actorIds.length > 0) {
            orConditions.push({ actorId: { $in: actorIds } });
        }

        return { $or: orConditions };
    }

    private async enrichLogs(rawLogs: any[]): Promise<EnrichedActivityLog[]> {
        if (!rawLogs || rawLogs.length === 0) return [];

        const isMongoId = (id?: string | null): boolean => {
            return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
        };

        const actorIds = Array.from(new Set(rawLogs.map(l => l.actorId).filter(isMongoId)));
        const workspaceIds = Array.from(new Set(rawLogs.map(l => l.workspaceId).filter(isMongoId)));
        const orgIds = Array.from(new Set(rawLogs.map(l => l.organizationId).filter(isMongoId)));

        const [users, workspaces, organizations] = await Promise.all([
            actorIds.length > 0 ? UserModel.find({ _id: { $in: actorIds } }, { username: 1, email: 1 }).lean() : [],
            workspaceIds.length > 0 ? WorkspaceModel.find({ _id: { $in: workspaceIds } }, { workspaceName: 1 }).lean() : [],
            orgIds.length > 0 ? OrganizationModel.find({ _id: { $in: orgIds } }, { companyName: 1 }).lean() : [],
        ]);

        const userMap = new Map<string, { username: string; email: string }>();
        users.forEach((u: any) => userMap.set(u._id.toString(), { username: u.username, email: u.email }));

        const workspaceMap = new Map<string, string>();
        workspaces.forEach((w: any) => workspaceMap.set(w._id.toString(), w.workspaceName));

        const orgMap = new Map<string, string>();
        organizations.forEach((o: any) => orgMap.set(o._id.toString(), o.companyName));

        return rawLogs.map((log: any) => {
            const user = log.actorId ? userMap.get(log.actorId.toString()) : undefined;
            const workspaceName = log.workspaceId ? workspaceMap.get(log.workspaceId.toString()) : undefined;
            const organizationName = log.organizationId ? orgMap.get(log.organizationId.toString()) : undefined;

            const actorName =
                user?.username ||
                (log.metadata?.ownerName as string) ||
                (log.metadata?.username as string) ||
                (log.actorRole ? log.actorRole.replace("-", " ") : "System");

            const actorEmail =
                user?.email ||
                (log.metadata?.ownerEmail as string) ||
                (log.metadata?.email as string) ||
                undefined;

            return {
                ...log,
                _id: log._id ? log._id.toString() : "",
                actorName,
                actorEmail,
                workspaceName: workspaceName || (log.metadata?.workspaceName as string) || undefined,
                organizationName: organizationName || (log.metadata?.companyName as string) || undefined,
            };
        });
    }

    async getWorkspaceActivityLogs(workspaceId: string, options: ActivityLogQueryOptions): Promise<PaginatedActivityLogs> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const skip = (page - 1) * limit;

        const searchFilter = await this.buildSearchFilter(options.search);
        const filter = { workspaceId, ...searchFilter };

        const [rawLogs, total] = await Promise.all([
            this.model.find(filter).sort({ occurredAt: -1 }).skip(skip).limit(limit).lean(),
            this.model.countDocuments(filter),
        ]);

        const logs = await this.enrichLogs(rawLogs);

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getOrganizationActivityLogs(organizationId: string, options: ActivityLogQueryOptions): Promise<PaginatedActivityLogs> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const skip = (page - 1) * limit;

        const searchFilter = await this.buildSearchFilter(options.search);
        const filter = { organizationId, ...searchFilter };

        const [rawLogs, total] = await Promise.all([
            this.model.find(filter).sort({ occurredAt: -1 }).skip(skip).limit(limit).lean(),
            this.model.countDocuments(filter),
        ]);

        const logs = await this.enrichLogs(rawLogs);

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getSystemActivityLogs(options: ActivityLogQueryOptions): Promise<PaginatedActivityLogs> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const skip = (page - 1) * limit;

        const searchFilter = await this.buildSearchFilter(options.search);
        const filter = searchFilter;

        const [rawLogs, total] = await Promise.all([
            this.model.find(filter).sort({ occurredAt: -1 }).skip(skip).limit(limit).lean(),
            this.model.countDocuments(filter),
        ]);

        const logs = await this.enrichLogs(rawLogs);

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
}
