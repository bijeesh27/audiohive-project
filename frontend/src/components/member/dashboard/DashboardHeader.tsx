import React from "react";
import { CalendarDays, ShieldCheck } from "lucide-react";

interface DashboardHeaderProps {
  username?: string | null;
  organizationName?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  username,
  organizationName,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = username ? username.trim().split(" ")[0] : "there";

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
          <span>{todayFormatted}</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          {getGreeting()},{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">
            {organizationName || "AudioHive Office"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/60">
            <ShieldCheck className="h-3 w-3" />
            Member
          </span>
        </div>
      </div>
    </div>
  );
};
