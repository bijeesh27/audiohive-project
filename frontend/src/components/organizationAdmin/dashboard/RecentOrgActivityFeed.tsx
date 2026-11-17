import React from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, Clock } from "lucide-react";
import { API_ROUTES } from "../../../constants/Api_Routes";
import type { OwnerRecentActivityItem } from "../../../services/organizationServices";

interface RecentOrgActivityFeedProps {
  activities?: OwnerRecentActivityItem[];
  loading?: boolean;
}

const formatRelativeTime = (iso: string): string => {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    if (diffMs < 0) return "Just now";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
};

const formatActionText = (action: string): string => {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const RoleBadge: React.FC<{ role?: string }> = ({ role }) => {
  if (!role) return null;
  const normalized = role.toLowerCase();
  const isOwner = normalized.includes("owner");
  const isAdmin = normalized.includes("admin");

  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
        isOwner
          ? "bg-purple-50 text-purple-700 border border-purple-200"
          : isAdmin
          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {role.replace("-", " ")}
    </span>
  );
};

export const RecentOrgActivityFeed: React.FC<RecentOrgActivityFeedProps> = ({
  activities = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs animate-pulse space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="w-32 h-4 rounded bg-gray-100" />
          <div className="w-20 h-4 rounded bg-gray-100" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="w-48 h-3 rounded bg-gray-100" />
                <div className="w-24 h-2 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">Recent Organization Activity</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit logs of latest workspace, member, and admin events
          </p>
        </div>

        <Link
          to={API_ROUTES.ORGANIZATION_ADMIN.NAV.ACTIVITY_LOGS}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <span>View all logs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Feed list */}
      {activities.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-xs">
          No recent activity logs recorded for this organization
        </div>
      ) : (
        <div className="divide-y divide-gray-100 mt-2">
          {activities.map((item) => (
            <div key={item.id} className="py-3 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-600 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-gray-900 truncate">{item.actorName}</span>
                    <RoleBadge role={item.actorRole} />
                    <span className="text-gray-600 font-medium">{formatActionText(item.action)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                    {item.workspaceName && (
                      <span className="text-gray-500 font-medium">in {item.workspaceName}</span>
                    )}
                    {item.targetType && (
                      <span className="text-gray-400">• {item.targetType}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0 mt-0.5">
                <Clock className="w-3 h-3 text-gray-300" />
                <span>{formatRelativeTime(item.occurredAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
