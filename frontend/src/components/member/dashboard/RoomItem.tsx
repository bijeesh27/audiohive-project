import React from "react";
import { Lock, Globe, ArrowRight } from "lucide-react";
import type { ActiveRoom, RoomParticipantInfo } from "../../../types/memberDashboard";

interface RoomItemProps {
  room: ActiveRoom;
  onJoin: (roomId: string) => void;
}

export const RoomItem: React.FC<RoomItemProps> = ({ room, onJoin }) => {
  const isLive = room.participantCount > 0;
  const isPrivate = room.type === "private";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-indigo-100 hover:bg-gray-50/50">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold text-sm tracking-wide ${
              isLive
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {room.name.slice(0, 2).toUpperCase()}
          </div>
          {isLive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{room.name}</h4>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                isPrivate
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60"
                  : "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60"
              }`}
            >
              {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              {isPrivate ? "Private" : "Public"}
            </span>

            {isLive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Live
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
            {room.description || "General discussion room"}
          </p>

          <div className="mt-2 flex items-center gap-2">
            {isLive ? (
              <div className="flex items-center">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {room.liveParticipants.slice(0, 4).map((p: RoomParticipantInfo, index: number) => (
                    <div
                      key={p.userId || index}
                      title={p.username}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white"
                    >
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <span className="ml-2 text-xs font-medium text-emerald-600">
                  {room.participantCount} {room.participantCount === 1 ? "person" : "people"} in room
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">0 active participants</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onJoin(room._id)}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 self-stretch sm:self-center flex-shrink-0"
      >
        <span>Join</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
