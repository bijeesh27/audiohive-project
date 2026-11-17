import React from "react";
import {
  Building2,
  Users,
  Radio,
  Video,
  Clock,
  DoorOpen,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { OwnerDashboardKPIs } from "../../../services/organizationServices";

interface OwnerKpiCardsProps {
  kpis?: OwnerDashboardKPIs;
  loading?: boolean;
}

const TrendBadge: React.FC<{
  delta?: { deltaPercent: number; trend: "up" | "down" | "neutral" };
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
      title={`${prefix}${deltaPercent}% compared to previous period`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{prefix}{deltaPercent}%</span>
    </span>
  );
};

export const OwnerKpiCards: React.FC<OwnerKpiCardsProps> = ({ kpis, loading = false }) => {
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

  const {
    workspaces,
    totalMembers,
    onlineNow,
    meetingsConducted,
    meetingTime,
    activeRooms,
  } = kpis;

  const cards = [
    {
      id: "workspaces",
      label: "WORKSPACES",
      value: `${workspaces.active} / ${workspaces.total}`,
      subtext: `${workspaces.suspended + workspaces.archived} inactive or archived`,
      delta: workspaces.delta,
      icon: Building2,
      iconBg: "bg-indigo-50 text-indigo-600",
    },
    {
      id: "totalMembers",
      label: "TOTAL MEMBERS",
      value: totalMembers.current.toLocaleString(),
      subtext: `${totalMembers.previous} in previous period`,
      delta: totalMembers,
      icon: Users,
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      id: "onlineNow",
      label: "ONLINE NOW",
      value: `${onlineNow.online} / ${onlineNow.total}`,
      subtext: `${onlineNow.offline} currently offline`,
      icon: Radio,
      iconBg: "bg-emerald-50 text-emerald-600",
      customBadge: (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      ),
    },
    {
      id: "meetingsConducted",
      label: "MEETINGS CONDUCTED",
      value: meetingsConducted.total.toLocaleString(),
      subtext: `${meetingsConducted.completed} completed • ${meetingsConducted.live} live`,
      delta: meetingsConducted,
      icon: Video,
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      id: "meetingTime",
      label: "TOTAL MEETING TIME",
      value: meetingTime.formattedDuration,
      subtext: meetingTime.previousMinutes > 0 ? `${meetingTime.previousMinutes}m in prev period` : "Tracked across all calls",
      delta: meetingTime,
      icon: Clock,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      id: "activeRooms",
      label: "ACTIVE ROOMS",
      value: `${activeRooms.active} / ${activeRooms.total}`,
      subtext: `${activeRooms.blocked} blocked / inactive`,
      delta: activeRooms,
      icon: DoorOpen,
      iconBg: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between"
          >
            {/* Top row: Icon and Trend Delta */}
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${card.iconBg} flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              {card.customBadge ? card.customBadge : <TrendBadge delta={card.delta} />}
            </div>

            {/* Bottom: Label, Value, and Accurate Subtext */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                {card.label}
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight font-mono tabular-nums">
                {card.value}
              </p>
              {card.subtext && (
                <p className="text-[11px] text-gray-400 mt-1 truncate" title={card.subtext}>
                  {card.subtext}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
