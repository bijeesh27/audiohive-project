import { useEffect, useState, useCallback } from "react";
import {
  Users,
  UserCheck,
  Search,
  Activity,
  Clock,
  Eye,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Award,
  Sparkles,
} from "lucide-react";
import {
  getWorkspaceUserAnalytics,
} from "../../services/workspaceAdminServices";
import type {
  WorkspaceUserAnalyticsParams,
} from "../../services/workspaceAdminServices";
import {
  DateRangeFilter,
} from "../../components/analytics/DateRangeFilter";
import type {
  DateRangePreset,
} from "../../components/analytics/DateRangeFilter";
import {
  MetricCard,
  TrendAreaChart,
} from "../../components/analytics/AnalyticsCharts";
import type {
  ChartDataPoint,
} from "../../components/analytics/AnalyticsCharts";
import { UserActivityHistoryModal } from "../../components/workspaceAdmin/UserActivityHistoryModal";

interface UserActivityRecord {
  userId: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  isOnline: boolean;
  joinedAt: string;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
  totalLogins: number;
  meetingsAttended: number;
  meetingDurationMinutes: number;
  roomsCount: number;
  activityCount: number;
}

interface UserRank {
  userId: string;
  username: string;
  email: string;
  activityCount: number;
  meetingsAttended: number;
  totalMeetingDurationMinutes: number;
  lastActiveAt: string | null;
  isOnline: boolean;
}

interface RecentlyJoined {
  userId: string;
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
  joinedAt: string;
}

interface WorkspaceAnalyticsData {
  workspaceId: string;
  workspaceName: string;
  dateRange: {
    range: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalMembers: number;
    onlineCount: number;
    offlineCount: number;
    activeCount: number;
    inactiveCount: number;
  };
  recentlyJoined: RecentlyJoined[];
  activityTrends: Array<{
    date: string;
    label: string;
    activityCount: number;
    loginCount: number;
    meetingCount: number;
  }>;
  topActiveUsers: UserRank[];
  leastActiveUsers: UserRank[];
  records: {
    items: UserActivityRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function UserActivityAnalytics() {
  const [data, setData] = useState<WorkspaceAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [dateRange, setDateRange] = useState<DateRangePreset>("7d");
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // User History Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: WorkspaceUserAnalyticsParams = {
        range: dateRange,
        startDate,
        endDate,
        search: search.trim() || undefined,
        page,
        limit: 10,
      };
      const res = await getWorkspaceUserAnalytics(params);
      if (res?.data) {
        setData(res.data);
      }
    } catch {
      setError("Failed to fetch workspace user activity analytics.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate, search, page]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRangeChange = (preset: DateRangePreset, start?: string, end?: string) => {
    setDateRange(preset);
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleViewHistory = (userId: string) => {
    setSelectedUserId(userId);
    setIsHistoryModalOpen(true);
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return "0m";
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return "Never";
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

  // Convert activity trends to ChartDataPoint (Activities vs Logins)
  const trendPoints: ChartDataPoint[] =
    data?.activityTrends.map((t) => ({
      label: t.label,
      val1: t.activityCount,
      val2: t.loginCount,
    })) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER & DATE FILTERS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              User Activity Analytics
            </h1>
            {data?.workspaceName && (
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
                {data.workspaceName}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Track member login behavior, meeting duration, room participation, and audit histories.
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
          <button onClick={fetchAnalytics} className="underline font-semibold hover:text-rose-800">
            Try again
          </button>
        </div>
      )}

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Members"
          value={data?.summary.totalMembers ?? (loading ? "..." : 0)}
          subtext={`${data?.summary.onlineCount ?? 0} online now`}
          icon={Users}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          badge={{ text: "Assigned", variant: "info" }}
        />

        <MetricCard
          title="Online / Offline"
          value={`${data?.summary.onlineCount ?? 0} / ${data?.summary.offlineCount ?? 0}`}
          subtext="Active socket presence"
          icon={UserCheck}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          badge={{
            text: `${data?.summary.onlineCount ?? 0} Live`,
            variant: "success",
          }}
        />

        <MetricCard
          title="Active Status"
          value={`${data?.summary.activeCount ?? 0} Active`}
          subtext={`${data?.summary.inactiveCount ?? 0} disabled members`}
          icon={Shield}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          badge={{
            text: `${data?.summary.inactiveCount ?? 0} Inactive`,
            variant: data?.summary.inactiveCount ? "warning" : "neutral",
          }}
        />

        <MetricCard
          title="Activity Trends"
          value={
            data
              ? data.activityTrends.reduce((sum, t) => sum + t.activityCount, 0)
              : loading
                ? "..."
                : 0
          }
          subtext={`${data?.activityTrends.reduce((sum, t) => sum + t.loginCount, 0) ?? 0} total logins in range`}
          icon={Activity}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          badge={{ text: "In Range", variant: "neutral" }}
        />
      </div>

      {/* ── CHART & RECENTLY JOINED ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2">
          <TrendAreaChart
            data={trendPoints}
            title="User Activity & Login Trends"
            subtitle="Comparing total member actions vs daily logins"
            metric1Name="Total Actions"
            metric2Name="Logins"
            metric1Color="#6366f1"
            metric2Color="#f59e0b"
          />
        </div>

        {/* Recently Joined Members (1 col) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Recently Joined Members
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Newest additions to this workspace</p>
          </div>

          <div className="space-y-3 my-auto">
            {data?.recentlyJoined.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${user.isOnline ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.username}</p>
                    <p className="text-[11px] text-gray-400">{user.email}</p>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 text-right">
                  {new Date(user.joinedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))}

            {(!data || data.recentlyJoined.length === 0) && (
              <p className="text-xs text-gray-400 text-center py-6">No recent members</p>
            )}
          </div>
        </div>
      </div>

      {/* ── LEADERBOARD: MOST & LEAST ACTIVE USERS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Active Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Most Active Users
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Top members by actions & meetings</p>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Top 5
            </span>
          </div>

          <div className="space-y-3">
            {data?.topActiveUsers.map((u, idx) => (
              <div
                key={u.userId}
                className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-gray-400 text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">{u.username}</span>
                      {u.isOnline && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="font-bold text-indigo-600 text-sm">{u.activityCount}</span>
                    <span className="text-[10px] text-gray-400 block">
                      {u.meetingsAttended} meetings ({formatDuration(u.totalMeetingDurationMinutes)})
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewHistory(u.userId)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    title="View user history"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {(!data || data.topActiveUsers.length === 0) && (
              <p className="text-xs text-gray-400 text-center py-6">No activity records found</p>
            )}
          </div>
        </div>

        {/* Least Active Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Least Active Users
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Members with low or zero interaction</p>
            </div>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Needs Engagement
            </span>
          </div>

          <div className="space-y-3">
            {data?.leastActiveUsers.map((u, idx) => (
              <div
                key={u.userId}
                className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-gray-400 text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">{u.username}</span>
                      {u.isOnline && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="font-bold text-gray-600 text-sm">{u.activityCount}</span>
                    <span className="text-[10px] text-gray-400 block">
                      Last: {formatTimestamp(u.lastActiveAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewHistory(u.userId)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    title="View user history"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {(!data || data.leastActiveUsers.length === 0) && (
              <p className="text-xs text-gray-400 text-center py-6">No inactive records</p>
            )}
          </div>
        </div>
      </div>

      {/* ── PAGINATED USER ACTIVITY RECORDS TABLE ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Member Activity Records</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Detailed tracking of logins, meeting duration, room access, and last active times
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white w-full sm:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/50">
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Active</th>
                <th className="py-2.5 px-3">Last Login</th>
                <th className="py-2.5 px-3">Logins</th>
                <th className="py-2.5 px-3">Meetings</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Rooms</th>
                <th className="py-2.5 px-3">Total Actions</th>
                <th className="py-2.5 px-3 text-right">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && !data ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading user records...
                  </td>
                </tr>
              ) : data?.records.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    No members matching your search.
                  </td>
                </tr>
              ) : (
                data?.records.items.map((row) => (
                  <tr key={row.userId} className="hover:bg-gray-50/80 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {row.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${row.isOnline ? "bg-emerald-500" : "bg-gray-300"
                              }`}
                            title={row.isOnline ? "Online" : "Offline"}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{row.username}</p>
                          <p className="text-[11px] text-gray-400">{row.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.status
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {row.status ? "Active" : "Disabled"}
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          {row.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </td>

                    {/* Last Active */}
                    <td className="py-3 px-3 text-gray-700">
                      {formatTimestamp(row.lastActiveAt)}
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-3 text-gray-700">
                      {formatTimestamp(row.lastLoginAt)}
                    </td>

                    {/* Logins Count */}
                    <td className="py-3 px-3 font-semibold text-gray-800">
                      {row.totalLogins}
                    </td>

                    {/* Meetings Attended */}
                    <td className="py-3 px-3 font-semibold text-gray-800">
                      {row.meetingsAttended}
                    </td>

                    {/* Meeting Duration */}
                    <td className="py-3 px-3 text-gray-600 font-medium">
                      {formatDuration(row.meetingDurationMinutes)}
                    </td>

                    {/* Rooms Count */}
                    <td className="py-3 px-3 text-gray-600">
                      {row.roomsCount}
                    </td>

                    {/* Total Actions */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {row.activityCount}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleViewHistory(row.userId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                        title="Inspect full activity history"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <span>
            Showing {data?.records.items.length ?? 0} of {data?.records.total ?? 0} members
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors flex items-center gap-1 font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <span className="font-semibold text-gray-900 px-2">
              Page {data?.records.page ?? 1} of {data?.records.totalPages ?? 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data?.records.totalPages ?? 1, p + 1))}
              disabled={page >= (data?.records.totalPages ?? 1) || loading}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors flex items-center gap-1 font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── USER ACTIVITY HISTORY MODAL ── */}
      {selectedUserId && (
        <UserActivityHistoryModal
          userId={selectedUserId}
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
}
