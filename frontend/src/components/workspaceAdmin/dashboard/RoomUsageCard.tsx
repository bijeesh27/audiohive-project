import React from "react";
import { DoorOpen, Video } from "lucide-react";
import type { RoomUsage, MeetingsOverview } from "../../../services/workspaceAdminServices";

interface RoomUsageCardProps {
  rooms?: RoomUsage[];
  meetingsOverview?: MeetingsOverview;
  loading?: boolean;
}

export const RoomUsageCard: React.FC<RoomUsageCardProps> = ({
  rooms = [],
  meetingsOverview,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs h-80 flex flex-col justify-between animate-pulse">
        <div className="w-32 h-4 rounded bg-gray-100" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="h-16 rounded-xl bg-gray-100" />
      </div>
    );
  }

  const maxActivity = Math.max(...rooms.map((r) => r.activityCount), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* ── TOP ROOMS RANKED LIST ── */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-indigo-600" />
              Room Usage
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Top collaboration rooms by member actions</p>
          </div>
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            Top {rooms.length}
          </span>
        </div>

        <div className="mt-3 space-y-2.5 max-h-44 overflow-y-auto pr-1">
          {rooms.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No room activity recorded</p>
          ) : (
            rooms.map((room) => {
              const percent = Math.min(100, Math.round((room.activityCount / maxActivity) * 100));
              return (
                <div
                  key={room.roomId}
                  className="p-2 rounded-xl bg-gray-50/70 border border-gray-100 text-xs hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-gray-900 truncate">{room.name}</span>
                      <span className="text-[10px] text-gray-500 uppercase px-1.5 py-0.2 rounded bg-gray-200/60 font-medium">
                        {room.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] text-indigo-600 font-bold font-mono">
                        {room.activityCount} <span className="text-gray-400 font-normal">actions</span>
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(6, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── MEETINGS OVERVIEW MINI-STAT ── */}
      <div className="mt-4 pt-3.5 border-t border-gray-100">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Video className="w-3.5 h-3.5 text-indigo-600" />
          <h3 className="text-xs font-bold text-gray-900">Meetings Overview</h3>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100/70">
            <span className="text-[10px] text-blue-700 font-semibold block uppercase">Scheduled</span>
            <span className="text-base font-bold text-blue-900 font-mono tabular-nums">
              {meetingsOverview?.scheduled ?? 0}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100/70">
            <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Completed</span>
            <span className="text-base font-bold text-emerald-900 font-mono tabular-nums">
              {meetingsOverview?.completed ?? 0}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100/70">
            <span className="text-[10px] text-purple-700 font-semibold block uppercase">Live Now</span>
            <span className="text-base font-bold text-purple-900 font-mono tabular-nums">
              {meetingsOverview?.live ?? 0}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100/70">
            <span className="text-[10px] text-amber-700 font-semibold block uppercase">Avg Length</span>
            <span className="text-xs font-bold text-amber-900 mt-1 block truncate">
              {meetingsOverview?.formattedAvgDuration || "–"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
