import React from "react";
import {
  Building2,
  Users,
  LayoutGrid,
  Video,
  Sparkles,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { SuperAdminKpiStats, MetricDelta } from "../../../services/superAdminServices";

interface SuperAdminKpiCardsProps {
  kpis?: SuperAdminKpiStats;
  loading?: boolean;
}

const TrendBadge: React.FC<{
  delta?: MetricDelta;
}> = ({ delta }) => {
  if (!delta) return null;

  const { deltaPercent, trend } = delta;
  const isUp = trend === "up";
  const isDown = trend === "down";

  const colorClass = isUp
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isDown
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : "bg-gray-50 text-gray-600 border-gray-200";

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const prefix = deltaPercent > 0 ? "+" : "";

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorClass} tracking-tight`}
      title={`${prefix}${deltaPercent}% vs previous period`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>
        {prefix}
        {deltaPercent}%
      </span>
    </span>
  );
};

export const SuperAdminKpiCards: React.FC<SuperAdminKpiCardsProps> = ({
  kpis,
  loading = false,
}) => {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-xs animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-gray-100" />
              <div className="w-12 h-4 rounded-full bg-gray-100" />
            </div>
            <div className="space-y-1.5">
              <div className="w-16 h-3 rounded bg-gray-100" />
              <div className="w-24 h-7 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: "organizations",
      title: "Organizations",
      mainValue: `${kpis.organizations.active} / ${kpis.organizations.total}`,
      label: "Active / Total",
      subtext: `${kpis.organizations.active} active (last 30d)`,
      delta: kpis.organizations.delta,
      icon: Building2,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      id: "users",
      title: "Total Users",
      mainValue: kpis.users.total.toLocaleString(),
      label: "Platform Users",
      subtext: (
        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {kpis.users.online} online now
        </span>
      ),
      delta: kpis.users.delta,
      icon: Users,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      id: "workspaces",
      title: "Workspaces",
      mainValue: kpis.workspaces.total.toLocaleString(),
      label: "Total Spaces",
      subtext: "Across all orgs",
      delta: kpis.workspaces.delta,
      icon: LayoutGrid,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      id: "meetings",
      title: "Meetings in Range",
      mainValue: kpis.meetings.conducted.toLocaleString(),
      label: "Conducted",
      subtext: `${kpis.meetings.formattedDuration} total time`,
      delta: kpis.meetings.delta,
      icon: Video,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      id: "newOrgs",
      title: "New Organizations",
      mainValue: kpis.newOrganizations.count.toLocaleString(),
      label: "In selected range",
      subtext: "Registered on platform",
      delta: kpis.newOrganizations.delta,
      icon: Sparkles,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      id: "subscriptions",
      title: "Paid Subscriptions",
      mainValue: `${kpis.subscriptions.paid} / ${kpis.subscriptions.total}`,
      label: "Paid / Total Orgs",
      subtext: `${Math.round((kpis.subscriptions.paid / (kpis.subscriptions.total || 1)) * 100)}% on paid plans`,
      delta: kpis.subscriptions.delta,
      icon: CreditCard,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <section aria-label="Platform Key Performance Indicators">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`w-8 h-8 rounded-xl ${c.iconBg} ${c.iconColor} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <TrendBadge delta={c.delta} />
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                  {c.title}
                </span>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
                  {c.mainValue}
                </p>
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {c.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
