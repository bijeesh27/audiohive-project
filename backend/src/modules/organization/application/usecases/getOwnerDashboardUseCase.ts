import { Types } from "mongoose";
import { IuseCase } from "../../../../shared/interface/IuseCase.js";
import {
  GetOwnerDashboardInputDTO,
  OwnerDashboardResponseDTO,
  MemberDistributionItem,
  WorkspaceHealthItem,
  OwnerRecentActivityItem,
} from "../dto/ownerDashboardDTO.js";
import { OrganizationModel } from "../../infrastructure/organizationSchema.js";
import { WorkspaceModel } from "../../../workspace/infrastructure/workspaceSchema.js";
import { SubscriptionModel } from "../../../subscription/infrastructure/subscriptionSchema.js";
import { RoomModel } from "../../../room/infrastructure/roomSchema.js";
import { MeetingModel } from "../../../meeting/infrastructure/meetingSchema.js";
import { ActivityLogModel } from "../../../activityLog/infrastructure/activitylogSchema.js";
import { UserModel } from "../../../../shared/User.utils/userSchema.js";
import { parseDateRange } from "../../../../shared/utils/dateRangeHelper.js";
import { AppError } from "../../../../common/Errors/AppError.js";
import { HttpStatus } from "../../../../common/constant/httpStatus.js";
import { MESSAGES } from "../../../../common/constant/messages.js";
import {
  SharedMetricsService,
  computeDelta,
} from "../../../../shared/metrics/sharedMetricsService.js";

export class GetOwnerDashboardUseCase
  implements IuseCase<GetOwnerDashboardInputDTO, OwnerDashboardResponseDTO>
{
  async execute(input: GetOwnerDashboardInputDTO): Promise<OwnerDashboardResponseDTO> {
    const org = await OrganizationModel.findOne({ ownerEmail: input.ownerEmail });
    if (!org) {
      throw new AppError(MESSAGES.ERRORS.ORANIZATION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const orgIdStr = org._id.toString();

    // 1. Parse Date Range
    const { start, end, rangeType, buckets } = parseDateRange(
      input.range,
      input.startDate,
      input.endDate
    );
    const durationMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durationMs);
    const prevEnd = new Date(start.getTime());

    // 2. Fetch Workspaces for this Organization
    const workspaces = await WorkspaceModel.find({ organizationId: org._id })
      .sort({ createdAt: -1 })
      .lean();

    const workspaceIdStrings = workspaces.map((w) => w._id.toString());
    const workspaceObjIds = workspaces.map((w) => w._id);

    // 3. Workspaces Summary & Delta
    const activeWsCount = workspaces.filter((w) => w.status === "active").length;
    const suspendedWsCount = workspaces.filter((w) => w.status === "suspended").length;
    const archivedWsCount = workspaces.filter((w) => w.status === "archived").length;
    const totalWsCount = workspaces.length;

    const prevWorkspacesCount = workspaces.filter((w) => {
      const created = (w as { createdAt?: Date }).createdAt;
      return created ? new Date(created) <= prevEnd : true;
    }).length;
    const workspacesDelta = computeDelta(totalWsCount, prevWorkspacesCount);

    // 4. Unified Members Metrics via SharedMetricsService
    const membersMetrics = await SharedMetricsService.getMembersMetrics(
      workspaceIdStrings,
      workspaces.map((w) => ({ _id: w._id, workspaceName: w.workspaceName, status: w.status })),
      prevEnd
    );

    // 5. Unified Rooms Metrics via SharedMetricsService
    const roomsMetrics = await SharedMetricsService.getRoomsMetrics(workspaceIdStrings, prevEnd);

    // 6. Unified Meetings Metrics via SharedMetricsService
    const meetingsMetrics = await SharedMetricsService.getMeetingsMetrics(
      workspaceIdStrings,
      start,
      end,
      prevStart,
      prevEnd
    );

    // 7. Plan & Usage
    let plan = null;
    if (org.planId && org.planId !== "free" && Types.ObjectId.isValid(org.planId)) {
      plan = await SubscriptionModel.findById(org.planId).lean();
    }
    if (!plan) {
      plan =
        (await SubscriptionModel.findOne({ price: 0 }).lean()) ||
        (await SubscriptionModel.findOne({}).lean());
    }

    const calcMetric = (
      current: number,
      limit: number | null | undefined
    ): {
      current: number;
      limit: number | null;
      percent: number;
      isUnlimited: boolean;
      status: "normal" | "warning" | "exceeded";
    } => {
      if (!limit || limit <= 0) {
        return { current, limit: null, percent: 0, isUnlimited: true, status: "normal" };
      }
      const percent = Math.min(100, Math.round((current / limit) * 100));
      const status: "normal" | "warning" | "exceeded" =
        current >= limit ? "exceeded" : percent >= 80 ? "warning" : "normal";
      return { current, limit, percent, isUnlimited: false, status };
    };

    const maxWorkspacesLimit = plan?.maxWorkspaces ?? 5;
    const maxRoomsLimit = plan?.maxRooms ?? 10;
    // maxUsers is not in current plan schema, so treated as unlimited or features based
    const maxUsersLimit = (plan as unknown as { maxUsers?: number })?.maxUsers ?? null;

    const planUsage = {
      planId: plan ? plan._id.toString() : "free",
      planName: plan?.subscriptionName || "Free Plan",
      price: plan?.price || 0,
      renewalDate: null as string | null, // Subscription model lacks recurring renewal fields
      workspaces: calcMetric(totalWsCount, maxWorkspacesLimit),
      rooms: calcMetric(roomsMetrics.totalRooms, maxRoomsLimit),
      members: calcMetric(membersMetrics.totalMembers, maxUsersLimit),
    };

    // 8. Aggregated Daily Activity & Meeting Trends (Dual-Axis)
    const [activitiesDaily, meetingsDaily] = await Promise.all([
      ActivityLogModel.aggregate([
        {
          $match: {
            $or: [
              { organizationId: orgIdStr },
              { workspaceId: { $in: workspaceIdStrings } },
            ],
            occurredAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
      MeetingModel.aggregate([
        {
          $match: {
            workspaceId: { $in: workspaceObjIds },
            $or: [
              { startTime: { $gte: start, $lte: end } },
              { createdAt: { $gte: start, $lte: end } },
            ],
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $ifNull: ["$startTime", "$createdAt"] },
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const actMap = new Map<string, number>();
    for (const a of activitiesDaily) {
      if (a._id) actMap.set(a._id, a.count || 0);
    }

    const meetMap = new Map<string, number>();
    for (const m of meetingsDaily) {
      if (m._id) meetMap.set(m._id, m.count || 0);
    }

    const activityChart = buckets.map((b) => ({
      date: b.date,
      label: b.label,
      activities: actMap.get(b.date) || 0,
      meetings: meetMap.get(b.date) || 0,
    }));

    // 9. Workspace Health Table & Status Chips
    const [roomsByWorkspace, meetingsByWorkspace, lastActivityByWorkspace] = await Promise.all([
      RoomModel.aggregate([
        { $match: { workspaceId: { $in: workspaceObjIds } } },
        { $group: { _id: "$workspaceId", count: { $sum: 1 } } },
      ]),
      MeetingModel.aggregate([
        {
          $match: {
            workspaceId: { $in: workspaceObjIds },
            $or: [
              { startTime: { $gte: start, $lte: end } },
              { createdAt: { $gte: start, $lte: end } },
            ],
          },
        },
        { $group: { _id: "$workspaceId", count: { $sum: 1 } } },
      ]),
      ActivityLogModel.aggregate([
        { $match: { workspaceId: { $in: workspaceIdStrings } } },
        { $group: { _id: "$workspaceId", lastActivity: { $max: "$occurredAt" } } },
      ]),
    ]);

    const wsRoomCountMap = new Map<string, number>();
    for (const r of roomsByWorkspace) {
      if (r._id) wsRoomCountMap.set(r._id.toString(), r.count);
    }

    const wsMeetingCountMap = new Map<string, number>();
    for (const m of meetingsByWorkspace) {
      if (m._id) wsMeetingCountMap.set(m._id.toString(), m.count);
    }

    const wsLastActivityMap = new Map<string, string>();
    for (const l of lastActivityByWorkspace) {
      if (l._id && l.lastActivity) {
        wsLastActivityMap.set(l._id.toString(), new Date(l.lastActivity).toISOString());
      }
    }

    const workspaceHealthItems: WorkspaceHealthItem[] = workspaces.map((w) => {
      const wIdStr = w._id.toString();
      const dist = membersMetrics.distribution.find((d) => d.workspaceId === wIdStr);
      const memberCount = dist ? dist.memberCount : 0;

      // Online count in this workspace
      const onlineInWs = membersMetrics.allMembers.filter((m) => {
        const inThis = m.workspaceIds?.includes(wIdStr) || m.workspaceId === wIdStr;
        return inThis && (m as unknown as { status: boolean }).status !== false && membersMetrics.onlineCount > 0;
      }).length;

      return {
        id: wIdStr,
        name: w.workspaceName,
        slug: w.slug,
        status: w.status,
        memberCount,
        onlineNow: onlineInWs,
        roomsCount: wsRoomCountMap.get(wIdStr) || 0,
        meetingsCount: wsMeetingCountMap.get(wIdStr) || 0,
        lastActivityAt: wsLastActivityMap.get(wIdStr) || (w as { updatedAt?: Date }).updatedAt?.toISOString() || null,
        createdAt: (w as { createdAt?: Date }).createdAt?.toISOString() || new Date().toISOString(),
      };
    });

    // 10. Member Distribution (Top 5 + Others, shown only if 2+ workspaces)
    const sortedDist = [...membersMetrics.distribution].sort((a, b) => b.memberCount - a.memberCount);
    let memberDistributionItems: MemberDistributionItem[] = [];

    if (workspaces.length >= 2) {
      const top5 = sortedDist.slice(0, 5);
      const others = sortedDist.slice(5);

      memberDistributionItems = top5.map((d) => ({
        workspaceId: d.workspaceId,
        workspaceName: d.workspaceName,
        memberCount: d.memberCount,
        percentage: d.percentage,
      }));

      if (others.length > 0) {
        const othersCount = others.reduce((acc, curr) => acc + curr.memberCount, 0);
        const othersPercent = membersMetrics.totalMembers > 0
          ? Math.round((othersCount / membersMetrics.totalMembers) * 100)
          : 0;
        memberDistributionItems.push({
          workspaceId: "others",
          workspaceName: "Others",
          memberCount: othersCount,
          percentage: othersPercent,
        });
      }
    }

    // 11. Recent 10 Org Activities
    const recentLogs = await ActivityLogModel.find({
      $or: [
        { organizationId: orgIdStr },
        { workspaceId: { $in: workspaceIdStrings } },
      ],
    })
      .sort({ occurredAt: -1 })
      .limit(10)
      .lean();

    const actorIds = Array.from(
      new Set(recentLogs.map((l) => l.actorId).filter(Boolean) as string[])
    );
    const actorUsers =
      actorIds.length > 0
        ? await UserModel.find({ _id: { $in: actorIds } }, { username: 1, email: 1 }).lean()
        : [];
    const actorMap = new Map<string, { username: string; email: string }>();
    actorUsers.forEach((u) =>
      actorMap.set(u._id.toString(), { username: u.username, email: u.email })
    );

    const wsNameMap = new Map<string, string>();
    workspaces.forEach((w) => wsNameMap.set(w._id.toString(), w.workspaceName));

    const recentActivities: OwnerRecentActivityItem[] = recentLogs.map((log) => {
      const user = log.actorId ? actorMap.get(log.actorId) : undefined;
      const workspaceName = log.workspaceId ? wsNameMap.get(log.workspaceId) : undefined;
      const actorName =
        user?.username ||
        (log.metadata?.ownerName as string) ||
        (log.metadata?.username as string) ||
        (log.actorRole ? log.actorRole.replace("-", " ") : "System");

      return {
        id: log._id.toString(),
        action: log.action,
        actorName,
        actorEmail: user?.email || (log.metadata?.email as string) || undefined,
        actorRole: log.actorRole,
        workspaceName,
        targetType: log.targetType,
        occurredAt: log.occurredAt.toISOString(),
      };
    });

    return {
      organization: {
        id: orgIdStr,
        name: org.companyName,
        ownerName: org.ownerName,
        ownerEmail: org.ownerEmail,
        status: org.status,
      },
      dateRange: {
        range: rangeType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        prevStartDate: prevStart.toISOString(),
        prevEndDate: prevEnd.toISOString(),
      },
      kpis: {
        workspaces: {
          active: activeWsCount,
          total: totalWsCount,
          suspended: suspendedWsCount,
          archived: archivedWsCount,
          delta: workspacesDelta,
        },
        totalMembers: {
          current: membersMetrics.totalMembers,
          previous: membersMetrics.membersDelta.previous,
          deltaPercent: membersMetrics.membersDelta.deltaPercent,
          trend: membersMetrics.membersDelta.trend,
        },
        onlineNow: {
          online: membersMetrics.onlineCount,
          offline: membersMetrics.offlineCount,
          total: membersMetrics.totalMembers,
        },
        meetingsConducted: {
          completed: meetingsMetrics.completedMeetings,
          live: meetingsMetrics.liveMeetings,
          total: meetingsMetrics.meetingsConducted,
          previous: meetingsMetrics.meetingsDelta.previous,
          deltaPercent: meetingsMetrics.meetingsDelta.deltaPercent,
          trend: meetingsMetrics.meetingsDelta.trend,
        },
        meetingTime: {
          totalMinutes: meetingsMetrics.totalDurationMinutes,
          formattedDuration: meetingsMetrics.formattedDuration,
          previousMinutes: meetingsMetrics.durationDelta.previous,
          deltaPercent: meetingsMetrics.durationDelta.deltaPercent,
          trend: meetingsMetrics.durationDelta.trend,
        },
        activeRooms: {
          active: roomsMetrics.activeRooms,
          total: roomsMetrics.totalRooms,
          blocked: roomsMetrics.blockedRooms,
          previous: roomsMetrics.activeRoomsDelta.previous,
          deltaPercent: roomsMetrics.activeRoomsDelta.deltaPercent,
          trend: roomsMetrics.activeRoomsDelta.trend,
        },
      },
      planUsage,
      activityChart,
      workspaceHealth: {
        chips: {
          active: activeWsCount,
          archived: archivedWsCount,
          suspended: suspendedWsCount,
          total: totalWsCount,
        },
        workspaces: workspaceHealthItems,
      },
      memberDistribution: {
        showChart: workspaces.length >= 2,
        items: memberDistributionItems,
      },
      recentActivities,
      lastUpdated: new Date().toISOString(),
    };
  }
}
