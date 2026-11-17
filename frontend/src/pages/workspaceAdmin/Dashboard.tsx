import { useEffect, useState, useCallback, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getWorkspaceDashboardData,
  getWorkspaceMembersActivity,
} from "../../services/workspaceAdminServices";
import type {
  DashboardData,
  MembersActivityResponse,
  GetMembersActivityParams,
} from "../../services/workspaceAdminServices";
import { DashboardHeader } from "../../components/workspaceAdmin/dashboard/DashboardHeader";
import type { DateRangeOption } from "../../components/workspaceAdmin/dashboard/DashboardHeader";
import { KpiCards } from "../../components/workspaceAdmin/dashboard/KpiCards";
import { ActivityChart } from "../../components/workspaceAdmin/dashboard/ActivityChart";
import { LiveNowPanel } from "../../components/workspaceAdmin/dashboard/LiveNowPanel";
import { EngagementLeaderboard } from "../../components/workspaceAdmin/dashboard/EngagementLeaderboard";
import { RoomUsageCard } from "../../components/workspaceAdmin/dashboard/RoomUsageCard";
import { MemberActivityTable } from "../../components/workspaceAdmin/dashboard/MemberActivityTable";
import type { SortField } from "../../components/workspaceAdmin/dashboard/MemberActivityTable";
import { MemberDrawer } from "../../components/workspaceAdmin/dashboard/MemberDrawer";
import { RecentActivityFeed } from "../../components/workspaceAdmin/dashboard/RecentActivityFeed";

export default function Dashboard() {
  const { username } = useAuth();

  // ── Global Filter State ──
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("7d");
  const [customStartDate, setCustomStartDate] = useState<string | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<string | undefined>(undefined);

  // ── Dashboard Aggregates State ──
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // ── Member Activity Table State ──
  const [membersData, setMembersData] = useState<MembersActivityResponse | null>(null);
  const [membersLoading, setMembersLoading] = useState<boolean>(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Table Controls State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [sortField, setSortField] = useState<SortField>("actions");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);

  // ── Member Drawer State ──
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // ── Fetch Dashboard Aggregates ──
  const fetchDashboard = useCallback(async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);
      const res = await getWorkspaceDashboardData({
        range: selectedRange,
        startDate: customStartDate,
        endDate: customEndDate,
      });
      if (res?.data) {
        setDashboardData(res.data);
      }
    } catch {
      setDashboardError("Failed to load dashboard overview. Please try refreshing.");
    } finally {
      setDashboardLoading(false);
    }
  }, [selectedRange, customStartDate, customEndDate]);

  // ── Fetch Members Activity ──
  const fetchMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      setMembersError(null);
      const params: GetMembersActivityParams = {
        range: selectedRange,
        startDate: customStartDate,
        endDate: customEndDate,
        search: searchQuery.trim() || undefined,
        status: statusFilter,
        sortField,
        sortOrder,
        page,
        limit: 10,
      };
      const res = await getWorkspaceMembersActivity(params);
      if (res?.data) {
        setMembersData(res.data);
      }
    } catch {
      setMembersError("Failed to load member activity records.");
    } finally {
      setMembersLoading(false);
    }
  }, [selectedRange, customStartDate, customEndDate, searchQuery, statusFilter, sortField, sortOrder, page]);

  // Parallel fetch on date-range change
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Range Change Handler
  const handleRangeChange = (range: DateRangeOption, start?: string, end?: string) => {
    setSelectedRange(range);
    setCustomStartDate(start);
    setCustomEndDate(end);
    setPage(1); // Reset table pagination
  };

  // Manual Refresh Handler
  const handleRefreshAll = () => {
    fetchDashboard();
    fetchMembers();
  };

  // Open Drawer for a user
  const handleOpenDrawer = (userId: string) => {
    setSelectedUserId(userId);
    setIsDrawerOpen(true);
  };

  // Memoized Chart Series
  const chartSeries = useMemo(() => {
    return dashboardData?.chartSeries || [];
  }, [dashboardData?.chartSeries]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. HEADER ROW ── */}
      <DashboardHeader
        workspaceName={dashboardData?.workspaceName || "Workspace"}
        adminName={dashboardData?.adminName || username || "Admin"}
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
        onRefresh={handleRefreshAll}
        isRefreshing={dashboardLoading || membersLoading}
        lastUpdated={dashboardData?.lastUpdated}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
      />

      {dashboardError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{dashboardError}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
            className="text-amber-900 font-semibold underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 2. KPI ROW (6 CARDS) ── */}
      <KpiCards kpis={dashboardData?.kpis} loading={dashboardLoading} />

      {/* ── 3. MAIN ANALYTICS ROW (Chart 2/3 + Live Now 1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <ActivityChart data={chartSeries} loading={dashboardLoading} />
        </div>
        <div className="lg:col-span-4">
          <LiveNowPanel
            liveMembers={dashboardData?.liveNow}
            recentlyJoined={dashboardData?.recentlyJoined}
            loading={dashboardLoading}
          />
        </div>
      </div>

      {/* ── 4. ENGAGEMENT ROW (Leaderboard 1/2 + Room Usage 1/2) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <EngagementLeaderboard
            mostActive={dashboardData?.leaderboard.mostActive}
            needsEngagement={dashboardData?.leaderboard.needsEngagement}
            loading={dashboardLoading}
            onSelectUser={handleOpenDrawer}
          />
        </div>
        <div className="lg:col-span-6">
          <RoomUsageCard
            rooms={dashboardData?.roomUsage.topRooms}
            meetingsOverview={dashboardData?.roomUsage.meetingsOverview}
            loading={dashboardLoading}
          />
        </div>
      </div>

      {/* ── 5. MEMBER ACTIVITY TABLE (FULL WIDTH) ── */}
      <div>
        {membersError && (
          <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <span>{membersError}</span>
            <button
              type="button"
              onClick={fetchMembers}
              className="text-rose-900 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}
        <MemberActivityTable
          items={membersData?.items}
          total={membersData?.total ?? 0}
          page={membersData?.page ?? 1}
          totalPages={membersData?.totalPages ?? 1}
          loading={membersLoading}
          onPageChange={setPage}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          onStatusFilterChange={(status) => {
            setStatusFilter(status);
            setPage(1);
          }}
          onSortChange={(field, order) => {
            setSortField(field);
            setSortOrder(order);
            setPage(1);
          }}
          onRowClick={handleOpenDrawer}
          currentSortField={sortField}
          currentSortOrder={sortOrder}
          currentStatusFilter={statusFilter}
        />
      </div>

      {/* ── 6. RECENT ACTIVITY FEED ── */}
      <div>
        <RecentActivityFeed
          activities={dashboardData?.recentActivities}
          loading={dashboardLoading}
        />
      </div>

      {/* ── MEMBER DRAWER (Slide-over on row click) ── */}
      <MemberDrawer
        userId={selectedUserId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
}
