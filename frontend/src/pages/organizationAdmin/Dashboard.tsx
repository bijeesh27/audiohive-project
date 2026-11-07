import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Users,
  Video,
  Clock,
  DoorOpen,
  Activity,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Archive,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getOrganizationAnalytics,
} from "../../services/organizationServices";
import type { OrgAnalyticsParams } from "../../services/organizationServices";
import {
  DateRangeFilter,
} from "../../components/analytics/DateRangeFilter";
import type { DateRangePreset } from "../../components/analytics/DateRangeFilter";
import {
  MetricCard,
  TrendAreaChart,
  DistributionDonutChart,
  HorizontalBarChart,
} from "../../components/analytics/AnalyticsCharts";
import type {
  DonutItem,
  BarItem,
  ChartDataPoint,
} from "../../components/analytics/AnalyticsCharts";

interface OrganizationAnalyticsData {
  organizationId: string;
  organizationName: string;
  ownerEmail: string;
  dateRange: {
    range: string;
    startDate: string;
    endDate: string;
  };
  workspacesSummary: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pending: number;
  };
  membersSummary: {
    totalMembers: number;
    distribution: Array<{
      workspaceId: string;
      workspaceName: string;
      memberCount: number;
      percentage: number;
      status: "active" | "suspended" | "archived";
    }>;
  };
  meetingsSummary: {
    totalMeetings: number;
    totalDurationMinutes: number;
    completedMeetings: number;
    liveMeetings: number;
    scheduledMeetings: number;
    cancelledMeetings: number;
  };
  roomsSummary: {
    totalRooms: number;
    activeRooms: number;
    blockedRooms: number;
    publicRooms: number;
    privateRooms: number;
  };
  activityTrends: Array<{
    date: string;
    label: string;
    activitiesCount: number;
    meetingsCount: number;
  }>;
  mostActiveWorkspaces: Array<{
    workspaceId: string;
    workspaceName: string;
    totalActivities: number;
    totalMeetings: number;
    totalMembers: number;
    status: string;
  }>;
  recentActivities: Array<{
    _id: string;
    action: string;
    actorName: string;
    actorEmail?: string;
    actorRole?: string;
    workspaceName?: string;
    targetType?: string;
    occurredAt: string;
  }>;
}

const PALETTE = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#14b8a6", // teal
];

export default function Dashboard() {
  const { username } = useAuth();
  const [data, setData] = useState<OrganizationAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<DateRangePreset>("7d");
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: OrgAnalyticsParams = {
        range: dateRange,
        startDate,
        endDate,
      };
      const res = await getOrganizationAnalytics(params);
      if (res?.data) {
        setData(res.data);
      }
    } catch {
      setError("Failed to load organization analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRangeChange = (preset: DateRangePreset, start?: string, end?: string) => {
    setDateRange(preset);
    setStartDate(start);
    setEndDate(end);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  const formatActivityAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // Convert distribution to Donut items
  const donutItems: DonutItem[] =
    data?.membersSummary.distribution.map((item, idx) => ({
      id: item.workspaceId,
      name: item.workspaceName,
      value: item.memberCount,
      percentage: item.percentage,
      color: PALETTE[idx % PALETTE.length],
    })) || [];

  // Convert activity trends to ChartDataPoint
  const trendPoints: ChartDataPoint[] =
    data?.activityTrends.map((t) => ({
      label: t.label,
      val1: t.activitiesCount,
      val2: t.meetingsCount,
    })) || [];

  // Convert most active workspaces to Bar items
  const activeWorkspaceBars: BarItem[] =
    data?.mostActiveWorkspaces.map((w, idx) => ({
      id: w.workspaceId,
      name: w.workspaceName,
      value: w.totalActivities,
      subValue: `${w.totalMeetings} meetings`,
      badge: w.status,
      color: PALETTE[idx % PALETTE.length],
    })) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER & FILTER BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Organization Analytics
            </h1>
            {data?.organizationName && (
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
                {data.organizationName}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Welcome back, {username || "Owner"}. Comprehensive workspace, member, and meeting performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangeFilter
            currentRange={dateRange}
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleRangeChange}
          />
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── ERROR ALERT ── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchAnalytics}
            className="underline font-semibold hover:text-rose-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── TOP KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Workspaces"
          value={data?.workspacesSummary.total ?? (loading ? "..." : 0)}
          subtext={`${data?.workspacesSummary.active ?? 0} active, ${data?.workspacesSummary.inactive ?? 0} archived`}
          icon={Building2}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          badge={{
            text: `${data?.workspacesSummary.active ?? 0} Active`,
            variant: "success",
          }}
        />

        <MetricCard
          title="Total Members"
          value={data?.membersSummary.totalMembers ?? (loading ? "..." : 0)}
          subtext={`Distributed across ${data?.workspacesSummary.total ?? 0} workspaces`}
          icon={Users}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          badge={{ text: "All Workspaces", variant: "info" }}
        />

        <MetricCard
          title="Meetings Conducted"
          value={data?.meetingsSummary.totalMeetings ?? (loading ? "..." : 0)}
          subtext={`${data?.meetingsSummary.completedMeetings ?? 0} completed, ${data?.meetingsSummary.liveMeetings ?? 0} live`}
          icon={Video}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          badge={{ text: "In Range", variant: "neutral" }}
        />

        <MetricCard
          title="Meeting Duration"
          value={
            data
              ? formatDuration(data.meetingsSummary.totalDurationMinutes)
              : loading
              ? "..."
              : "0m"
          }
          subtext={`${data?.roomsSummary.totalRooms ?? 0} total rooms created`}
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          badge={{ text: "Total Time", variant: "warning" }}
        />
      </div>

      {/* ── WORKSPACE STATUS BREAKDOWN STRIP ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-gray-400" />
            Workspace Status Overview
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            {data?.workspacesSummary.total ?? 0} Total Workspaces
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-emerald-800 font-medium">Active</p>
              <p className="text-lg font-bold text-emerald-950">
                {data?.workspacesSummary.active ?? 0}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-3">
            <Archive className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-gray-600 font-medium">Archived / Inactive</p>
              <p className="text-lg font-bold text-gray-900">
                {data?.workspacesSummary.inactive ?? 0}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-amber-800 font-medium">Suspended</p>
              <p className="text-lg font-bold text-amber-950">
                {data?.workspacesSummary.suspended ?? 0}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center gap-3">
            <DoorOpen className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-indigo-800 font-medium">Rooms Active</p>
              <p className="text-lg font-bold text-indigo-950">
                {data?.roomsSummary.activeRooms ?? 0} / {data?.roomsSummary.totalRooms ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW: TRENDS & DISTRIBUTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2">
          <TrendAreaChart
            data={trendPoints}
            title="Workspace Activity Trends"
            subtitle={`Daily activity logs and meetings held over the selected period`}
            metric1Name="Activities"
            metric2Name="Meetings"
            metric1Color="#6366f1"
            metric2Color="#10b981"
          />
        </div>

        {/* Member Distribution Donut Chart (1 col) */}
        <div className="lg:col-span-1">
          <DistributionDonutChart
            items={donutItems}
            title="Member Distribution"
            subtitle="Members assigned per workspace"
            centerNumber={data?.membersSummary.totalMembers ?? 0}
            centerLabel="Total Members"
          />
        </div>
      </div>

      {/* ── SECOND ROW: MOST ACTIVE WORKSPACES & ROOM STATS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Active Workspaces Bar Chart */}
        <HorizontalBarChart
          items={activeWorkspaceBars}
          title="Most Active Workspaces"
          subtitle="Ranked by total recorded activities and meetings"
          valueSuffix="activities"
        />

        {/* Room Usage Statistics Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Room Usage Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Room allocation and privacy breakdown across all workspaces
            </p>
          </div>

          <div className="space-y-4 my-auto">
            {/* Public vs Private */}
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                <span>Public Rooms: {data?.roomsSummary.publicRooms ?? 0}</span>
                <span>Private Rooms: {data?.roomsSummary.privateRooms ?? 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden flex">
                <div
                  className="bg-indigo-600 h-full transition-all"
                  style={{
                    width: `${
                      data && data.roomsSummary.totalRooms > 0
                        ? (data.roomsSummary.publicRooms / data.roomsSummary.totalRooms) * 100
                        : 50
                    }%`,
                  }}
                  title="Public"
                />
                <div
                  className="bg-purple-400 h-full transition-all"
                  style={{
                    width: `${
                      data && data.roomsSummary.totalRooms > 0
                        ? (data.roomsSummary.privateRooms / data.roomsSummary.totalRooms) * 100
                        : 50
                    }%`,
                  }}
                  title="Private"
                />
              </div>
            </div>

            {/* Active vs Blocked */}
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                <span>Active Rooms: {data?.roomsSummary.activeRooms ?? 0}</span>
                <span>Blocked Rooms: {data?.roomsSummary.blockedRooms ?? 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{
                    width: `${
                      data && data.roomsSummary.totalRooms > 0
                        ? (data.roomsSummary.activeRooms / data.roomsSummary.totalRooms) * 100
                        : 100
                    }%`,
                  }}
                  title="Active"
                />
                <div
                  className="bg-rose-400 h-full transition-all"
                  style={{
                    width: `${
                      data && data.roomsSummary.totalRooms > 0
                        ? (data.roomsSummary.blockedRooms / data.roomsSummary.totalRooms) * 100
                        : 0
                    }%`,
                  }}
                  title="Blocked"
                />
              </div>
            </div>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[11px] text-gray-500">Scheduled Meetings</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">
                  {data?.meetingsSummary.scheduledMeetings ?? 0}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[11px] text-gray-500">Live Calls Now</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  {data?.meetingsSummary.liveMeetings ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT ORGANIZATION ACTIVITIES FEED ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Recent Organization Activities
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live audit logs of workspace actions, meetings, and updates
            </p>
          </div>
        </div>

        {loading && !data ? (
          <div className="py-8 flex justify-center items-center text-gray-400 text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            Loading activities...
          </div>
        ) : data?.recentActivities.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            No recent activities recorded for this organization.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data?.recentActivities.map((act) => (
              <div
                key={act._id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/80 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                    {act.actorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {formatActivityAction(act.action)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      By <span className="font-medium text-gray-700">{act.actorName}</span>
                      {act.workspaceName && (
                        <span> in <span className="text-indigo-600 font-medium">{act.workspaceName}</span></span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 sm:text-right flex-shrink-0">
                  {formatTimestamp(act.occurredAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
