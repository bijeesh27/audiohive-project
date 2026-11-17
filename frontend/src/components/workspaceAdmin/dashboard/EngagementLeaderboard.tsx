import React, { useState } from "react";
import { Award, Clock, Flame } from "lucide-react";
import type { LeaderboardUser } from "../../../services/workspaceAdminServices";

interface EngagementLeaderboardProps {
  mostActive?: LeaderboardUser[];
  needsEngagement?: LeaderboardUser[];
  loading?: boolean;
  onSelectUser?: (userId: string) => void;
}

const formatRelativeTime = (iso: string | null): string => {
  if (!iso) return "Never";
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "–";
  }
};

export const EngagementLeaderboard: React.FC<EngagementLeaderboardProps> = ({
  mostActive = [],
  needsEngagement = [],
  loading = false,
  onSelectUser,
}) => {
  const [activeTab, setActiveTab] = useState<"most" | "needs">("most");

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs h-80 animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="w-36 h-4 rounded bg-gray-100" />
          <div className="w-24 h-6 rounded-lg bg-gray-100" />
        </div>
        <div className="mt-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="w-40 h-8 rounded bg-gray-100" />
              <div className="w-20 h-4 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const list = activeTab === "most" ? mostActive : needsEngagement;

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Card Header with Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-gray-100 gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Flame className="w-4 h-4 text-indigo-600" />
            Member Engagement
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Identify your power collaborators and members who need attention
          </p>
        </div>

        {/* Tabs Control */}
        <div className="inline-flex p-0.5 bg-gray-100 rounded-xl" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "most"}
            onClick={() => setActiveTab("most")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "most"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Most Active
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "needs"}
            onClick={() => setActiveTab("needs")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "needs"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Needs Engagement
          </button>
        </div>
      </div>

      {/* Leaderboard Rows */}
      <div className="mt-3 space-y-2.5 flex-1 overflow-y-auto max-h-72 pr-1">
        {list.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-xs">
            No member data available for this category
          </div>
        ) : (
          list.map((user, idx) => {
            const initials = user.username.slice(0, 2).toUpperCase();
            return (
              <div
                key={user.userId}
                onClick={() => onSelectUser?.(user.userId)}
                className="group p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Rank, Avatar, Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-4 text-center font-bold text-[11px] text-gray-400 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {initials}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${
                          user.isOnline ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                        title={user.isOnline ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {user.username}
                      </p>
                      <span className="text-[10px] text-gray-400 block truncate">
                        Last active: {formatRelativeTime(user.lastActiveAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Score / Actions */}
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-gray-900 text-xs font-mono tabular-nums">
                      {user.actionCount} <span className="font-normal text-[10px] text-gray-500">actions</span>
                    </span>
                    <span className="block text-[10px] text-gray-400">
                      {user.meetingsCount} meetings
                    </span>
                  </div>
                </div>

                {/* Mini Progress Bar */}
                <div className="mt-2 w-full bg-gray-200/70 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      activeTab === "most" ? "bg-indigo-600" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.max(4, user.progressPercent)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
