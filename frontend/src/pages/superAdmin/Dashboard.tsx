import { useEffect, useState, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getSuperAdminDashboardAnalytics,
} from "../../services/superAdminServices";
import type {
  SuperAdminDashboardData,
  DashboardQueryParams,
} from "../../services/superAdminServices";
import { DashboardHeader } from "../../components/superAdmin/dashboard/DashboardHeader";
import type { DateRangePreset } from "../../components/superAdmin/dashboard/DashboardHeader";
import { SuperAdminKpiCards } from "../../components/superAdmin/dashboard/SuperAdminKpiCards";
import { GrowthChart } from "../../components/superAdmin/dashboard/GrowthChart";
import { PlatformActivityChart } from "../../components/superAdmin/dashboard/PlatformActivityChart";
import { PlanDistributionCard } from "../../components/superAdmin/dashboard/PlanDistributionCard";
import { TopOrganizationsCard } from "../../components/superAdmin/dashboard/TopOrganizationsCard";
import { NeedsAttentionCard } from "../../components/superAdmin/dashboard/NeedsAttentionCard";
import { RecentPlatformActivityCard } from "../../components/superAdmin/dashboard/RecentPlatformActivityCard";

export default function Dashboard() {
  const { username } = useAuth();

  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRange, setSelectedRange] = useState<DateRangePreset>("7d");
  const [customStartDate, setCustomStartDate] = useState<string | undefined>();
  const [customEndDate, setCustomEndDate] = useState<string | undefined>();

  const loadData = useCallback(
    (params: DashboardQueryParams, isManualRefresh = false) => {
      let cancelled = false;
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      getSuperAdminDashboardAnalytics(params)
        .then((res) => {
          if (!cancelled && res?.data) {
            setData(res.data);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(
              err?.response?.data?.message ||
                "Failed to load platform analytics. Please try again."
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
            setIsRefreshing(false);
          }
        });

      return () => {
        cancelled = true;
      };
    },
    []
  );

  useEffect(() => {
    const params: DashboardQueryParams = {
      range: selectedRange,
      startDate: customStartDate,
      endDate: customEndDate,
    };
    return loadData(params);
  }, [loadData, selectedRange, customStartDate, customEndDate]);

  const handleRangeChange = (params: DashboardQueryParams) => {
    if (params.range) {
      setSelectedRange(params.range as DateRangePreset);
    }
    setCustomStartDate(params.startDate);
    setCustomEndDate(params.endDate);
  };

  const handleRefresh = () => {
    loadData(
      {
        range: selectedRange,
        startDate: customStartDate,
        endDate: customEndDate,
      },
      true
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with greeting, date-range controls, and refresh */}
      <DashboardHeader
        adminName={username || "Super Admin"}
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={data?.lastUpdated}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
      />

      {/* Global Error Banner with Retry */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between text-xs text-rose-800"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. KPI Cards Row (6 cards) */}
      <SuperAdminKpiCards kpis={data?.kpis} loading={loading} />

      {/* 3. Analytics Charts Grid (Growth Chart & Activity Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthChart data={data?.growthChart} loading={loading} />
        <PlatformActivityChart data={data?.activityChart} loading={loading} />
      </div>

      {/* 4. Plan Distribution & Needs Attention Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlanDistributionCard
          distribution={data?.planDistribution}
          loading={loading}
        />
        <NeedsAttentionCard items={data?.needsAttention} loading={loading} />
      </div>

      {/* 5. Top Organizations Table */}
      <TopOrganizationsCard
        organizations={data?.topOrganizations}
        loading={loading}
      />

      {/* 6. Recent Platform Activity Feed */}
      <RecentPlatformActivityCard
        activities={data?.recentActivity}
        loading={loading}
      />
    </div>
  );
}
