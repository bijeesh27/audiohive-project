import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  Clock,
  LogIn,
  Video,
  DoorOpen,
  Activity,
  Loader2,
} from "lucide-react";
import { getUserActivityHistory } from "../../../services/workspaceAdminServices";

interface MemberDrawerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  userId: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  isOnline: boolean;
}

interface ActivityItem {
  _id: string;
  action: string;
  actorName: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

interface UserStats {
  totalLogins: number;
  meetingsAttended: number;
  meetingDurationMinutes: number;
  formattedMeetingDuration: string;
  roomsCount: number;
  roomNames: string[];
  totalActions: number;
}

export const MemberDrawer: React.FC<MemberDrawerProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getUserActivityHistory(userId, { page: 1, limit: 20 });
      if (res?.data) {
        setProfile(res.data.user);
        setStats(res.data.stats || null);
        setItems(res.data.items || []);
      }
    } catch {
      setError("Failed to load member profile details.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchDetails();
    } else {
      setProfile(null);
      setStats(null);
      setItems([]);
    }
  }, [isOpen, userId, fetchDetails]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "U";

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const formatRelativeTime = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 14) return `${diffDays}d ago`;
      return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="member-drawer-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md md:max-w-lg bg-white border-l border-gray-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {initials}
                </div>
                {profile && (
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                      profile.isOnline ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                    title={profile.isOnline ? "Online" : "Offline"}
                  />
                )}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h2 id="member-drawer-title" className="text-base font-bold text-gray-900 truncate">
                    {profile?.username || "Member Details"}
                  </h2>
                  {profile && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        profile.status
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {profile.status ? "Active" : "Disabled"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                <span>Loading member activity profile...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center">
                {error}
              </div>
            ) : (
              <>
                {/* ── KPI METRICS GRID ── */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
                    Activity Overview
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                      <LogIn className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <span className="text-[10px] text-gray-500 uppercase font-medium block">Logins</span>
                      <span className="text-base font-bold text-gray-900 font-mono tabular-nums">
                        {stats?.totalLogins ?? 0}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                      <Video className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                      <span className="text-[10px] text-gray-500 uppercase font-medium block">Meetings</span>
                      <span className="text-base font-bold text-gray-900 font-mono tabular-nums">
                        {stats?.meetingsAttended ?? 0}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                      <Clock className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <span className="text-[10px] text-gray-500 uppercase font-medium block">Meeting Time</span>
                      <span className="text-xs font-bold text-gray-900 mt-1 block truncate">
                        {stats?.formattedMeetingDuration || "–"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                      <Activity className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                      <span className="text-[10px] text-gray-500 uppercase font-medium block">Total Actions</span>
                      <span className="text-base font-bold text-gray-900 font-mono tabular-nums">
                        {stats?.totalActions ?? items.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── ACCESSIBLE ROOMS ── */}
                {stats && stats.roomNames && stats.roomNames.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <DoorOpen className="w-3.5 h-3.5 text-indigo-600" />
                      Assigned Rooms ({stats.roomsCount})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {stats.roomNames.map((name, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-xs font-medium bg-indigo-50/70 text-indigo-700 rounded-lg border border-indigo-100"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── ACTIONS TIMELINE ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-600" />
                      Recent Actions Timeline
                    </h3>
                    <span className="text-[11px] text-gray-400">Latest {items.length} events</span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">
                      No recorded action events for this member
                    </p>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                      {items.map((it) => (
                        <div key={it._id} className="relative group">
                          {/* Dot */}
                          <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-indigo-50 border-2 border-indigo-600 group-hover:bg-indigo-600 transition-colors" />

                          <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 text-xs hover:bg-white hover:border-gray-200 hover:shadow-xs transition-all">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-gray-900 capitalize">
                                {it.action.replace(/_/g, " ").toLowerCase()}
                              </span>
                              <span
                                className="text-[10px] text-gray-400 font-medium cursor-help"
                                title={formatTimestamp(it.occurredAt)}
                              >
                                {formatRelativeTime(it.occurredAt)}
                              </span>
                            </div>

                            {it.targetType && (
                              <p className="text-[11px] text-gray-500">
                                Target: <span className="font-medium text-gray-700">{it.targetType}</span>
                              </p>
                            )}

                            {it.metadata && Object.keys(it.metadata).length > 0 && (
                              <div className="mt-1.5 pt-1.5 border-t border-gray-200/50 text-[10px] text-gray-400 font-mono truncate">
                                {JSON.stringify(it.metadata)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] text-gray-400">
              User ID: <span className="font-mono text-gray-600">{userId?.slice(-8)}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-gray-900 hover:bg-black text-white rounded-xl shadow-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
