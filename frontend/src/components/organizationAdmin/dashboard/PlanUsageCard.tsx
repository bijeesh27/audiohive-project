import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowUpRight, ShieldCheck, AlertCircle } from "lucide-react";
import { API_ROUTES } from "../../../constants/Api_Routes";
import type { PlanUsageInfo } from "../../../services/organizationServices";

interface PlanUsageCardProps {
  planUsage?: PlanUsageInfo;
  loading?: boolean;
}

export const PlanUsageCard: React.FC<PlanUsageCardProps> = ({ planUsage, loading = false }) => {
  if (loading || !planUsage) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-36 h-5 rounded bg-gray-100" />
          <div className="w-20 h-7 rounded-xl bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-14 rounded-xl bg-gray-100" />
          <div className="h-14 rounded-xl bg-gray-100" />
          <div className="h-14 rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  const { planName, price, workspaces, rooms, members } = planUsage;

  const getBarColor = (percent: number, status: string) => {
    if (status === "exceeded" || percent >= 100) return "bg-rose-500";
    if (status === "warning" || percent >= 80) return "bg-amber-500";
    return "bg-indigo-600";
  };

  const getTextColor = (percent: number, status: string) => {
    if (status === "exceeded" || percent >= 100) return "text-rose-600";
    if (status === "warning" || percent >= 80) return "text-amber-600";
    return "text-indigo-600";
  };

  const metrics = [
    {
      label: "Workspaces",
      current: workspaces.current,
      limit: workspaces.limit,
      percent: workspaces.percent,
      status: workspaces.status,
      isUnlimited: workspaces.isUnlimited,
    },
    {
      label: "Rooms Allowed",
      current: rooms.current,
      limit: rooms.limit,
      percent: rooms.percent,
      status: rooms.status,
      isUnlimited: rooms.isUnlimited,
    },
    {
      label: "Organization Members",
      current: members.current,
      limit: members.limit,
      percent: members.percent,
      status: members.status,
      isUnlimited: members.isUnlimited,
    },
  ];

  const hasExceeded = metrics.some((m) => m.status === "exceeded");
  const hasWarning = metrics.some((m) => m.status === "warning");

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">{planName}</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                Active Plan
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {price === 0 ? "Standard free tier" : `$${price}/month • Recurring subscription`}
            </p>
          </div>
        </div>

        <Link
          to={API_ROUTES.ORGANIZATION_ADMIN.NAV.SUBSCRIPTION}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <span>Upgrade Plan</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Warning banner if approaching or exceeding limit */}
      {(hasExceeded || hasWarning) && (
        <div
          className={`mt-4 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 ${
            hasExceeded
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {hasExceeded
              ? "You have reached or exceeded the allocated limits of your plan. Upgrade to unlock more capacity."
              : "You are approaching 80% of your plan limits. Consider upgrading before reaching maximum usage."}
          </span>
        </div>
      )}

      {/* Usage Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
        {metrics.map((m) => {
          const barColor = getBarColor(m.percent, m.status);
          const textColor = getTextColor(m.percent, m.status);

          return (
            <div key={m.label} className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-gray-700">{m.label}</span>
                <span className={`font-mono font-bold ${textColor}`}>
                  {m.current} {m.isUnlimited ? "" : `/ ${m.limit}`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${m.isUnlimited ? 15 : Math.max(4, m.percent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                <span>{m.isUnlimited ? "Unlimited tier" : `${m.percent}% used`}</span>
                {m.limit && m.current >= m.limit && (
                  <span className="text-rose-600 font-semibold">Limit reached</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
