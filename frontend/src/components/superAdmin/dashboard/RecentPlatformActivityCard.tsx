import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ExternalLink,
  Building2,
  Clock,
} from "lucide-react";
import type { RecentActivityItem } from "../../../services/superAdminServices";
import { API_ROUTES } from "../../../constants/Api_Routes";

interface RecentPlatformActivityCardProps {
  activities?: RecentActivityItem[];
  loading?: boolean;
}

const ROLE_BADGES: Record<string, string> = {
  superadmin: "bg-red-50 text-red-700 border-red-200",
  "organization-owner": "bg-purple-50 text-purple-700 border-purple-200",
  workspaceadmin: "bg-blue-50 text-blue-700 border-blue-200",
  member: "bg-gray-100 text-gray-700 border-gray-200",
  system: "bg-gray-100 text-gray-600 border-gray-200",
};

export const RecentPlatformActivityCard: React.FC<RecentPlatformActivityCardProps> = ({
  activities = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs animate-pulse space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="w-48 h-4 rounded bg-gray-100" />
          <div className="w-20 h-4 rounded bg-gray-100" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch {
      return "Recent";
    }
  };

  const formatActionName = (action: string) => {
    return action
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              Recent Platform Activity
            </h2>
          </div>
          <Link
            to={API_ROUTES.SUPER_ADMIN.NAV.ACTIVITY_LOGS}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-2 mb-3">
          Real-time security events, administrator interventions, and platform audit records
        </p>

        {activities.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No audit records found on the platform
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activities.map((act) => {
              const roleClass =
                ROLE_BADGES[act.actorRole] || ROLE_BADGES.system;

              return (
                <div
                  key={act.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-gray-50/60 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50/80 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 truncate">
                          {formatActionName(act.action)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${roleClass}`}
                        >
                          {act.actorRole}
                        </span>
                        {act.organizationName && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium truncate max-w-[150px]">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            {act.organizationName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        <span className="font-medium text-gray-700">{act.actorName}</span>
                        {" • "}
                        <span>{act.details}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(act.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
