import { IsuperAdminAnalyticsRepository } from "../domain/IsuperAdminAnalyticsRepository.ts";
import {
  SuperAdminDashboardQueryDTO,
  SuperAdminDashboardResponseDTO,
  GrowthDataPoint,
  ActivityDataPoint,
  PlanDistributionItem,
  TopOrganizationItem,
  NeedsAttentionItem,
  RecentActivityItem,
} from "../application/dtos/SuperAdminDashboardDTO.ts";
import { OrganizationModel } from "../../organization/infrastructure/organizationSchema.ts";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema.ts";
import { UserModel } from "../../../shared/User.utils/userSchema.ts";
import { MeetingModel } from "../../meeting/infrastructure/meetingSchema.ts";
import { ActivityLogModel } from "../../activityLog/infrastructure/activitylogSchema.ts";
import { SubscriptionModel } from "../../subscription/infrastructure/subscriptionSchema.ts";
import { socketService } from "../../../socket/socketService.ts";
import { UserRoles } from "../../../common/constant/userRoles.ts";
import {
  computeDelta,
  formatDuration,
} from "../../../shared/metrics/sharedMetricsService.ts";

interface CacheEntry {
  timestamp: number;
  data: SuperAdminDashboardResponseDTO;
}

const CACHE_TTL_MS = 45 * 1000; // 45 seconds cache
const cache = new Map<string, CacheEntry>();

export class SuperAdminAnalyticsRepository implements IsuperAdminAnalyticsRepository {
  private static indexesEnsured = false;

  constructor() {
    this.ensureIndexes();
  }

  /**
   * Ensures necessary database indexes for fast platform-wide aggregations.
   */
  private async ensureIndexes(): Promise<void> {
    if (SuperAdminAnalyticsRepository.indexesEnsured) return;
    try {
      await Promise.allSettled([
        ActivityLogModel.collection.createIndex({ occurredAt: -1 }),
        ActivityLogModel.collection.createIndex({ organizationId: 1, occurredAt: -1 }),
        ActivityLogModel.collection.createIndex({ action: 1, occurredAt: -1 }),
        MeetingModel.collection.createIndex({ startTime: -1 }),
        MeetingModel.collection.createIndex({ status: 1, startTime: -1 }),
        MeetingModel.collection.createIndex({ workspaceId: 1, startTime: -1 }),
        OrganizationModel.collection.createIndex({ createdAt: -1 }),
        OrganizationModel.collection.createIndex({ status: 1 }),
        WorkspaceModel.collection.createIndex({ organizationId: 1 }),
        UserModel.collection.createIndex({ createdAt: -1, role: 1 }),
      ]);
      SuperAdminAnalyticsRepository.indexesEnsured = true;
    } catch {
      // Index creation silently handles existing or conflicting indexes
    }
  }

  async getDashboardAnalytics(
    query: SuperAdminDashboardQueryDTO
  ): Promise<SuperAdminDashboardResponseDTO> {
    const range = query.range || "7d";
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (range === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (range === "30d") {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "custom" && query.startDate && query.endDate) {
      start = new Date(query.startDate);
      end = new Date(query.endDate);
    } else {
      // Default: 7d
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime());
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const cacheKey = `${range}_${start.toISOString()}_${end.toISOString()}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // Parallel fetch for core collections
    const [
      allOrganizations,
      allWorkspaces,
      allUsers,
      allPlans,
    ] = await Promise.all([
      OrganizationModel.find().lean(),
      WorkspaceModel.find().lean(),
      UserModel.find({
        role: {
          $in: [
            UserRoles.ORGANIZATION_OWNER,
            UserRoles.WORKSPACE_ADMIN,
            UserRoles.MEMBER,
            "workspace-admin",
          ],
        },
      }).lean(),
      SubscriptionModel.find().lean(),
    ]);

    // 1. Organizations KPI
    const totalOrgs = allOrganizations.length;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch activities in last 30 days to determine "Active Organization"
    // An active organization has status === "active" AND (created in last 30d OR has activity in last 30d)
    const [recentLogsOrgIds, recentMeetingsOrgWorkspaces] = await Promise.all([
      ActivityLogModel.distinct("organizationId", { occurredAt: { $gte: thirtyDaysAgo } }),
      MeetingModel.distinct("workspaceId", {
        status: { $in: ["completed", "live"] },
        startTime: { $gte: thirtyDaysAgo },
      }),
    ]);

    const activeWorkspaceIdStrings = new Set(recentMeetingsOrgWorkspaces.map((id) => id.toString()));
    const orgsWithMeetingActivity = new Set(
      allWorkspaces
        .filter((w) => activeWorkspaceIdStrings.has(w._id.toString()))
        .map((w) => w.organizationId?.toString())
        .filter(Boolean)
    );

    const activeOrgIdsSet = new Set<string>();
    for (const org of allOrganizations) {
      const orgIdStr = org._id.toString();
      const isNotSuspended = org.status === "active";
      const isRecent = new Date(org.createdAt) >= thirtyDaysAgo;
      const hasRecentLog = recentLogsOrgIds.includes(orgIdStr);
      const hasMeeting = orgsWithMeetingActivity.has(orgIdStr);

      if (isNotSuspended && (isRecent || hasRecentLog || hasMeeting)) {
        activeOrgIdsSet.add(orgIdStr);
      }
    }

    const activeOrgsCount = activeOrgIdsSet.size;
    const prevOrgsCount = allOrganizations.filter(
      (o) => new Date(o.createdAt) <= prevEnd
    ).length;
    const orgsDelta = computeDelta(totalOrgs, prevOrgsCount);

    // New Organizations in Range
    const newOrgsCurrent = allOrganizations.filter(
      (o) => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end
    ).length;
    const newOrgsPrev = allOrganizations.filter(
      (o) => new Date(o.createdAt) >= prevStart && new Date(o.createdAt) < start
    ).length;
    const newOrgsDelta = computeDelta(newOrgsCurrent, newOrgsPrev);

    // 2. Total Users KPI
    const totalUsersCount = allUsers.length;
    let onlineUsersCount = 0;
    for (const u of allUsers) {
      if (socketService.isUserOnline(u._id.toString())) {
        onlineUsersCount++;
      }
    }
    const prevUsersCount = allUsers.filter(
      (u) => (u as { createdAt?: Date }).createdAt && new Date((u as { createdAt?: Date }).createdAt!) <= prevEnd
    ).length;
    const usersDelta = computeDelta(totalUsersCount, prevUsersCount);

    // 3. Workspaces KPI
    const totalWorkspacesCount = allWorkspaces.length;
    const prevWorkspacesCount = allWorkspaces.filter(
      (w) => (w as { createdAt?: Date }).createdAt && new Date((w as { createdAt?: Date }).createdAt!) <= prevEnd
    ).length;
    const workspacesDelta = computeDelta(totalWorkspacesCount, prevWorkspacesCount);

    // 4. Meetings & Total Duration in Range
    const [meetingsCurrent, meetingsPrev, callLogsCurrent, callLogsPrev] = await Promise.all([
      MeetingModel.find({
        status: { $in: ["completed", "live"] },
        startTime: { $gte: start, $lte: end },
      }).lean(),
      MeetingModel.find({
        status: { $in: ["completed", "live"] },
        startTime: { $gte: prevStart, $lt: start },
      }).lean(),
      ActivityLogModel.find({
        action: "CALL_ATTENDED",
        occurredAt: { $gte: start, $lte: end },
      }).lean(),
      ActivityLogModel.find({
        action: "CALL_ATTENDED",
        occurredAt: { $gte: prevStart, $lt: start },
      }).lean(),
    ]);

    let conductedMinutes = 0;
    for (const m of meetingsCurrent) {
      if (m.startTime && m.endTime) {
        const mins = Math.max(0, Math.round((new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 60000));
        conductedMinutes += mins;
      }
    }
    for (const log of callLogsCurrent) {
      const dur = Number(log.metadata?.durationMinutes || 0);
      if (dur > 0) conductedMinutes += dur;
    }

    let prevMinutes = 0;
    for (const m of meetingsPrev) {
      if (m.startTime && m.endTime) {
        const mins = Math.max(0, Math.round((new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 60000));
        prevMinutes += mins;
      }
    }
    for (const log of callLogsPrev) {
      const dur = Number(log.metadata?.durationMinutes || 0);
      if (dur > 0) prevMinutes += dur;
    }

    const meetingsDelta = computeDelta(meetingsCurrent.length, meetingsPrev.length);
    const durationDelta = computeDelta(conductedMinutes, prevMinutes);

    // 5. Paid Subscriptions KPI
    const paidPlansMap = new Map<string, typeof allPlans[0]>();
    for (const p of allPlans) {
      if (p.price > 0) {
        paidPlansMap.set(p._id.toString(), p);
      }
    }

    let paidSubscriptionsCount = 0;
    for (const o of allOrganizations) {
      if (o.planId && paidPlansMap.has(o.planId)) {
        paidSubscriptionsCount++;
      }
    }
    const subscriptionsDelta = computeDelta(paidSubscriptionsCount, paidSubscriptionsCount);

    // 6. Growth Chart (New Orgs and New Users per day in range)
    const dateMap = new Map<string, { newOrganizations: number; newUsers: number }>();
    const currDay = new Date(start.getTime());
    while (currDay <= end) {
      const key = currDay.toISOString().slice(0, 10);
      dateMap.set(key, { newOrganizations: 0, newUsers: 0 });
      currDay.setDate(currDay.getDate() + 1);
    }

    for (const org of allOrganizations) {
      const d = new Date(org.createdAt).toISOString().slice(0, 10);
      if (dateMap.has(d)) {
        dateMap.get(d)!.newOrganizations++;
      }
    }

    for (const user of allUsers) {
      const created = (user as { createdAt?: Date }).createdAt;
      if (created) {
        const d = new Date(created).toISOString().slice(0, 10);
        if (dateMap.has(d)) {
          dateMap.get(d)!.newUsers++;
        }
      }
    }

    const growthChart: GrowthDataPoint[] = Array.from(dateMap.entries()).map(
      ([date, vals]) => ({
        date,
        newOrganizations: vals.newOrganizations,
        newUsers: vals.newUsers,
      })
    );

    // 7. Activity Chart (Platform-wide meetings and actions per day)
    const activityDateMap = new Map<string, { meetings: number; actions: number }>();
    const currActDay = new Date(start.getTime());
    while (currActDay <= end) {
      const key = currActDay.toISOString().slice(0, 10);
      activityDateMap.set(key, { meetings: 0, actions: 0 });
      currActDay.setDate(currActDay.getDate() + 1);
    }

    for (const m of meetingsCurrent) {
      const d = new Date(m.startTime).toISOString().slice(0, 10);
      if (activityDateMap.has(d)) {
        activityDateMap.get(d)!.meetings++;
      }
    }

    const activityLogsCurrent = await ActivityLogModel.find({
      occurredAt: { $gte: start, $lte: end },
    }).select("occurredAt").lean();

    for (const log of activityLogsCurrent) {
      const d = new Date(log.occurredAt).toISOString().slice(0, 10);
      if (activityDateMap.has(d)) {
        activityDateMap.get(d)!.actions++;
      }
    }

    const activityChart: ActivityDataPoint[] = Array.from(activityDateMap.entries()).map(
      ([date, vals]) => ({
        date,
        meetings: vals.meetings,
        actions: vals.actions,
      })
    );

    // 8. Plan Distribution (Organizations per plan)
    const planCounts = new Map<string, number>();
    const plansById = new Map<string, typeof allPlans[0]>();
    for (const p of allPlans) {
      plansById.set(p._id.toString(), p);
    }

    for (const org of allOrganizations) {
      const pId = org.planId || "free";
      planCounts.set(pId, (planCounts.get(pId) || 0) + 1);
    }

    const planDistribution: PlanDistributionItem[] = [];
    for (const [pId, count] of planCounts.entries()) {
      const planDoc = plansById.get(pId);
      const planName = planDoc?.subscriptionName || (pId === "free" ? "Free" : "Custom");
      const price = planDoc?.price || 0;
      const percentage = totalOrgs > 0 ? Math.round((count / totalOrgs) * 100) : 0;
      planDistribution.push({
        planId: pId,
        planName,
        count,
        percentage,
        price,
      });
    }

    // 9. Top 5 Organizations by activity in range
    const orgWorkspacesMap = new Map<string, string[]>();
    for (const w of allWorkspaces) {
      const oId = w.organizationId?.toString();
      if (oId) {
        if (!orgWorkspacesMap.has(oId)) orgWorkspacesMap.set(oId, []);
        orgWorkspacesMap.get(oId)!.push(w._id.toString());
      }
    }

    // Map meetings to organizations
    const wsToOrgMap = new Map<string, string>();
    for (const w of allWorkspaces) {
      if (w.organizationId) {
        wsToOrgMap.set(w._id.toString(), w.organizationId.toString());
      }
    }

    const orgMeetingsCountMap = new Map<string, number>();
    for (const m of meetingsCurrent) {
      const oId = wsToOrgMap.get(m.workspaceId.toString());
      if (oId) {
        orgMeetingsCountMap.set(oId, (orgMeetingsCountMap.get(oId) || 0) + 1);
      }
    }

    // Members per organization
    const orgMembersCountMap = new Map<string, number>();
    for (const user of allUsers) {
      const userWsIds: string[] = [
        ...(Array.isArray(user.workspaceIds) ? user.workspaceIds.map((id) => id?.toString()) : []),
        user.workspaceId?.toString(),
      ].filter((id): id is string => Boolean(id));

      const orgsForUser = new Set<string>();
      for (const wId of userWsIds) {
        const oId = wsToOrgMap.get(wId);
        if (oId) orgsForUser.add(oId);
      }
      for (const oId of orgsForUser) {
        orgMembersCountMap.set(oId, (orgMembersCountMap.get(oId) || 0) + 1);
      }
    }

    // Fetch latest activity timestamp per organization
    const latestLogsPerOrg = await ActivityLogModel.aggregate([
      { $group: { _id: "$organizationId", lastOccurredAt: { $max: "$occurredAt" } } },
    ]);
    const lastActivityMap = new Map<string, Date>();
    for (const item of latestLogsPerOrg) {
      if (item._id) lastActivityMap.set(item._id.toString(), new Date(item.lastOccurredAt));
    }

    const orgActivityList: TopOrganizationItem[] = allOrganizations.map((org) => {
      const orgIdStr = org._id.toString();
      const planDoc = plansById.get(org.planId || "");
      const planName = planDoc?.subscriptionName || (org.planId === "free" ? "Free" : "Standard");
      const memberLimit = planDoc?.maxWorkspaces ? planDoc.maxWorkspaces * 25 : null;
      const wsCount = (orgWorkspacesMap.get(orgIdStr) || []).length;
      const membersCount = orgMembersCountMap.get(orgIdStr) || 0;
      const meetingsCount = orgMeetingsCountMap.get(orgIdStr) || 0;
      const lastActivity = lastActivityMap.get(orgIdStr)?.toISOString() || org.updatedAt?.toISOString() || null;

      return {
        id: orgIdStr,
        name: org.companyName,
        planName,
        workspacesCount: wsCount,
        membersCount,
        memberLimit,
        meetingsCount,
        lastActivity,
      };
    });

    orgActivityList.sort((a, b) => b.meetingsCount - a.meetingsCount || b.membersCount - a.membersCount);
    const topOrganizations = orgActivityList.slice(0, 5);

    // 10. Needs Attention List
    const needsAttention: NeedsAttentionItem[] = [];
    for (const org of allOrganizations) {
      const orgIdStr = org._id.toString();
      const planDoc = plansById.get(org.planId || "");
      const maxWorkspaces = planDoc?.maxWorkspaces || 2;
      const wsCount = (orgWorkspacesMap.get(orgIdStr) || []).length;

      // Near or over plan limits (>= 80%)
      if (wsCount >= Math.floor(maxWorkspaces * 0.8)) {
        needsAttention.push({
          id: orgIdStr,
          name: org.companyName,
          reason: "near_limit",
          details: `Workspace usage at ${wsCount} of ${maxWorkspaces} limit (${Math.round((wsCount / maxWorkspaces) * 100)}%)`,
          metric: `${wsCount}/${maxWorkspaces} workspaces`,
          severity: wsCount >= maxWorkspaces ? "danger" : "warning",
        });
      }

      // Expired / suspended status
      if (org.status === "suspended") {
        needsAttention.push({
          id: orgIdStr,
          name: org.companyName,
          reason: "expired_subscription",
          details: "Organization is currently suspended",
          metric: "Suspended",
          severity: "danger",
        });
      }

      // Inactive in 30 days
      const lastAct = lastActivityMap.get(orgIdStr);
      if (!lastAct || lastAct < thirtyDaysAgo) {
        const daysAgo = lastAct ? Math.round((now.getTime() - lastAct.getTime()) / (1000 * 60 * 60 * 24)) : 30;
        needsAttention.push({
          id: orgIdStr,
          name: org.companyName,
          reason: "inactive_30d",
          details: `No platform activity recorded in ${daysAgo} days`,
          metric: `${daysAgo}d inactive`,
          severity: "info",
        });
      }
    }

    // 11. Recent Platform Activity (latest 10)
    const recentLogs = await ActivityLogModel.find()
      .sort({ occurredAt: -1 })
      .limit(10)
      .lean();

    const actorIds = recentLogs.map((l) => l.actorId).filter((id): id is string => Boolean(id));
    const actors = await UserModel.find({ _id: { $in: actorIds } }).select("username email role").lean();
    const actorMap = new Map<string, typeof actors[0]>();
    for (const a of actors) {
      actorMap.set(a._id.toString(), a);
    }

    const orgNamesMap = new Map<string, string>();
    for (const o of allOrganizations) {
      orgNamesMap.set(o._id.toString(), o.companyName);
    }

    const recentActivity: RecentActivityItem[] = recentLogs.map((l) => {
      const actor = l.actorId ? actorMap.get(l.actorId) : null;
      const orgName = l.organizationId ? orgNamesMap.get(l.organizationId) : undefined;
      const details = typeof l.metadata?.details === "string"
        ? l.metadata.details
        : l.metadata?.targetName
        ? `Target: ${l.metadata.targetName}`
        : l.action;

      return {
        id: l._id.toString(),
        action: l.action,
        details,
        actorName: actor?.username || "System",
        actorEmail: actor?.email || "system@audiohive.internal",
        actorRole: actor?.role || l.actorRole || "system",
        organizationName: orgName,
        timestamp: (l.occurredAt || new Date()).toISOString(),
      };
    });

    const response: SuperAdminDashboardResponseDTO = {
      range,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      lastUpdated: now.toISOString(),
      kpis: {
        organizations: {
          active: activeOrgsCount,
          total: totalOrgs,
          delta: orgsDelta,
        },
        users: {
          total: totalUsersCount,
          online: onlineUsersCount,
          delta: usersDelta,
        },
        workspaces: {
          total: totalWorkspacesCount,
          delta: workspacesDelta,
        },
        meetings: {
          conducted: meetingsCurrent.length,
          totalDurationMinutes: conductedMinutes,
          formattedDuration: formatDuration(conductedMinutes),
          delta: meetingsDelta,
          durationDelta,
        },
        newOrganizations: {
          count: newOrgsCurrent,
          delta: newOrgsDelta,
        },
        subscriptions: {
          paid: paidSubscriptionsCount,
          total: totalOrgs,
          delta: subscriptionsDelta,
        },
      },
      growthChart,
      activityChart,
      planDistribution,
      topOrganizations,
      needsAttention,
      recentActivity,
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: response });
    return response;
  }
}
