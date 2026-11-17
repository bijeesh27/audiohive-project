import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  LogIn,
  DoorOpen,
  Megaphone,
  Video,
  FileText,
  UserPlus,
} from "lucide-react";
import { API_ROUTES } from "../../../constants/Api_Routes";
import type { RecentActivityItem } from "../../../services/workspaceAdminServices";

interface RecentActivityFeedProps {
  activities?: RecentActivityItem[];
  loading?: boolean;
}

const formatRelativeTime = (iso: string): string => {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
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

const getActionDetails = (action: string) => {
  const norm = (action || "").toUpperCase();
  if (norm.includes("LOGIN")) {
    return {
      icon: LogIn,
      iconColor: "text-blue-600 bg-blue-50 border-blue-100",
      label: "Logged in",
    };
  }
  if (norm.includes("ROOM")) {
    return {
      icon: DoorOpen,
      iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
      label: norm.replace(/_/g, " "),
    };
  }
  if (norm.includes("ANNOUNCEMENT")) {
    return {
      icon: Megaphone,
      iconColor: "text-purple-600 bg-purple-50 border-purple-100",
      label: norm.replace(/_/g, " "),
    };
  }
  if (norm.includes("MEETING") || norm.includes("CALL")) {
    return {
      icon: Video,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-100",
      label: norm.replace(/_/g, " "),
    };
  }
  if (norm.includes("DOCUMENT") || norm.includes("FILE")) {
    return {
      icon: FileText,
      iconColor: "text-amber-600 bg-amber-50 border-amber-100",
      label: norm.replace(/_/g, " "),
    };
  }
  if (norm.includes("INVITE") || norm.includes("JOIN")) {
    return {
      icon: UserPlus,
      iconColor: "text-teal-600 bg-teal-50 border-teal-100",
      label: norm.replace(/_/g, " "),
    };
  }
  return {
    icon: Activity,
    iconColor: "text-gray-600 bg-gray-50 border-gray-100",
    label: norm.replace(/_/g, " "),
  };
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="w-36 h-4 rounded bg-gray-100" />
          <div className="w-20 h-4 rounded bg-gray-100" />
        </div>
        <div className="mt-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-1">
                <div className="w-48 h-3 rounded bg-gray-100" />
                <div className="w-24 h-2.5 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Recent Workspace Activity
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Live audit trail of actions taken by workspace members</p>
        </div>

        <Link
          to={API_ROUTES.WORKSPACE_ADMIN.NAV.ACTIVITY_LOGS}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="mt-3 divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            No recent activity logged for this workspace
          </div>
        ) : (
          activities.map((item) => {
            const { icon: Icon, iconColor, label } = getActionDetails(item.action);
            return (
              <div
                key={item.id}
                className="py-2.5 px-1 flex items-center justify-between gap-4 hover:bg-gray-50/70 rounded-xl transition-colors text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl border ${iconColor} flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-gray-900 font-medium truncate">
                      <span className="font-semibold text-gray-900">{item.actorName || "Member"}</span>{" "}
                      <span className="text-gray-600 font-normal">{label.toLowerCase()}</span>
                    </p>
                    {item.actorEmail && (
                      <p className="text-[11px] text-gray-400 truncate">{item.actorEmail}</p>
                    )}
                  </div>
                </div>

                <span className="text-[11px] text-gray-400 flex-shrink-0 font-medium">
                  {formatRelativeTime(item.occurredAt)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
