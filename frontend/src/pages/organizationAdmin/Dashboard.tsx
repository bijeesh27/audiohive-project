import { useEffect, useState, useCallback } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useOrganization } from "../../context/OrganizationContext";
import {
  getOwnerDashboard,
  type OwnerDashboardData,
  type OrgAnalyticsParams,
} from "../../services/organizationServices";
import { DashboardHeader, type DateRangePreset } from "../../components/organizationAdmin/dashboard/DashboardHeader";
import { OwnerKpiCards } from "../../components/organizationAdmin/dashboard/OwnerKpiCards";
import { PlanUsageCard } from "../../components/organizationAdmin/dashboard/PlanUsageCard";
import { OwnerActivityChart } from "../../components/organizationAdmin/dashboard/OwnerActivityChart";
import { WorkspaceHealthTable } from "../../components/organizationAdmin/dashboard/WorkspaceHealthTable";
import { MemberDistributionCard } from "../../components/organizationAdmin/dashboard/MemberDistributionCard";
import { RecentOrgActivityFeed } from "../../components/organizationAdmin/dashboard/RecentOrgActivityFeed";

export default function Dashboard() {
  const { username } = useAuth();
  const { organization, refreshOrganization } = useOrganization();

  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [dateRangeParams, setDateRangeParams] = useState<OrgAnalyticsParams>({
    range: "7d",
  });

  const fetchDashboardData = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const res = await getOwnerDashboard(dateRangeParams);
        if (res?.data) {
          setData(res.data);
        }
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
        setError(
          errorObj?.response?.data?.message ||
            errorObj?.message ||
            "Failed to load organization dashboard analytics. Please retry."
        );
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [dateRangeParams]
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRangeChange = (params: OrgAnalyticsParams) => {
    setDateRangeParams(params);
  };

  const handleManualRefresh = () => {
    fetchDashboardData(true);
    refreshOrganization().catch(() => {});
  };

  const orgName = data?.organization.name || organization?.companyName || "Organization";
  const ownerName = data?.organization.ownerName || organization?.ownerName || username || "Owner";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header (Greeting, Date Range, Refresh Button) */}
      <DashboardHeader
        organizationName={orgName}
        ownerName={ownerName}
        selectedRange={(dateRangeParams.range as DateRangePreset) || "7d"}
        onRangeChange={handleRangeChange}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={data?.lastUpdated}
        customStartDate={dateRangeParams.startDate}
        customEndDate={dateRangeParams.endDate}
      />

      {/* Global Error Banner with Retry */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-xs text-rose-800 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. KPI Cards Row (6 cards) */}
      <section aria-label="Key Performance Indicators">
        <OwnerKpiCards kpis={data?.kpis} loading={loading} />
      </section>

      {/* 3. Plan & Usage Card */}
      <section aria-label="Plan and Usage">
        <PlanUsageCard planUsage={data?.planUsage} loading={loading} />
      </section>

      {/* 4. Activity & Meetings Chart (Dual Axis) */}
      <section aria-label="Activity Trends Chart">
        <OwnerActivityChart data={data?.activityChart} loading={loading} />
      </section>

      {/* 5. Workspace Health Table & Status Chips */}
      <section aria-label="Workspace Health">
        <WorkspaceHealthTable
          chips={data?.workspaceHealth.chips}
          workspaces={data?.workspaceHealth.workspaces}
          loading={loading}
        />
      </section>

      {/* 6. Member Distribution (Only rendered when 2+ workspaces exist; cleanly hidden when 1) */}
      {data?.memberDistribution.showChart && (
        <section aria-label="Member Distribution">
          <MemberDistributionCard
            showChart={data.memberDistribution.showChart}
            items={data.memberDistribution.items}
            loading={loading}
          />
        </section>
      )}

      {/* 7. Recent Organization Activity Feed */}
      <section aria-label="Recent Activities">
        <RecentOrgActivityFeed activities={data?.recentActivities} loading={loading} />
      </section>
    </div>
  );
}
