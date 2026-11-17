import React from "react";
import { Sparkles, DoorOpen, Users } from "lucide-react";
import type { LiveMember, RecentlyJoinedMember } from "../../../services/workspaceAdminServices";

interface LiveNowPanelProps {
  liveMembers?: LiveMember[];
  recentlyJoined?: RecentlyJoinedMember[];
  loading?: boolean;
}

export const LiveNowPanel: React.FC<LiveNowPanelProps> = ({
  liveMembers = [],
  recentlyJoined = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs h-80 flex flex-col justify-between animate-pulse">
        <div className="space-y-3">
          <div className="w-24 h-4 rounded bg-gray-100" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-100" />
                <div className="w-32 h-3.5 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* ── LIVE NOW SECTION ── */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Live Now</h2>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {liveMembers.length} active
          </span>
        </div>

        <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
          {liveMembers.length === 0 ? (
            <div className="py-4 text-center text-gray-400 text-xs">
              <Users className="w-5 h-5 mx-auto mb-1 text-gray-300" />
              <span>No members currently online</span>
            </div>
          ) : (
            liveMembers.map((member) => {
              const initials = member.username.slice(0, 2).toUpperCase();
              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100/80 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                        {initials}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-gray-900 truncate">{member.username}</p>
                      <p className="text-[10px] text-gray-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  {member.currentRoom ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 max-w-[100px] truncate"
                      title={`In room: ${member.currentRoom.name}`}
                    >
                      <DoorOpen className="w-3 h-3 flex-shrink-0 text-indigo-500" />
                      <span className="truncate">{member.currentRoom.name}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-medium">Browsing</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RECENTLY JOINED SECTION ── */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <h3 className="text-xs font-bold text-gray-900">Recently Joined</h3>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Newest members</span>
        </div>

        <div className="space-y-2">
          {recentlyJoined.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No recently joined members</p>
          ) : (
            recentlyJoined.slice(0, 3).map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between text-xs py-1 px-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-gray-800 text-xs truncate">{user.username}</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                  {new Date(user.joinedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
