import React from "react";
import { Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import type { UserActivitySummary } from "../../../types/memberDashboard";

interface YourActivityCardProps {
  activity?: UserActivitySummary;
}

export const YourActivityCard: React.FC<YourActivityCardProps> = ({ activity }) => {
  const hours = activity?.hoursThisWeek ?? 0;
  const meetings = activity?.meetingsAttended ?? 0;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 min-h-[44px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Clock className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 tracking-tight">Your Activity</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          This Week
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
            <span>Collab Time</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-gray-900">{hours}</span>
            <span className="text-xs text-gray-500">hrs</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Meetings</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-gray-900">{meetings}</span>
            <span className="text-xs text-gray-500">joined</span>
          </div>
        </div>
      </div>

      <p className="mt-3.5 text-[11px] text-gray-400 text-center">
        Tracked across audio rooms & scheduled meetings
      </p>
    </section>
  );
};
