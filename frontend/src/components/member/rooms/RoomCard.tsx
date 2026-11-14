import React, { useState } from "react";
import { Lock, Globe, ArrowRight, Loader2, Users } from "lucide-react";
import type { MemberRoom } from "../../../types/rooms";

interface RoomCardProps {
  room: MemberRoom;
  onJoin: (roomId: string) => Promise<void> | void;
  onCardClick: (roomId: string) => void;
}

const AVATAR_BG_COLORS = [
  "bg-indigo-600",
  "bg-purple-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-sky-600",
];

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin, onCardClick }) => {
  const [isJoining, setIsJoining] = useState(false);

  const isPrivate = room.type === "private";
  const isLive = room.isLive || room.participantCount > 0;
  const isFull = room.capacity > 0 && room.participantCount >= room.capacity;
  const remainingParticipants = Math.max(0, room.participantCount - 3);

  const handleJoinClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (isFull || isJoining) return;

    try {
      setIsJoining(true);
      await onJoin(room.id);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCardClick(room.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardClick(room.id)}
      onKeyDown={handleCardKeyDown}
      aria-label={`Room: ${room.name}. ${isPrivate ? "Private" : "Public"}. ${
        isLive ? `${room.participantCount} participants online` : "Idle"
      }`}
      className="group relative flex flex-col justify-between h-[232px] rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
    >
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Room Icon */}
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                isPrivate
                  ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100"
                  : "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"
              }`}
            >
              {isPrivate ? (
                <Lock className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Globe className="h-5 w-5" aria-hidden="true" />
              )}
            </div>

            {/* Room Name */}
            <h3
              title={room.name}
              className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors"
            >
              {room.name}
            </h3>
          </div>

          {/* Status Indicator */}
          {isLive ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/60 flex-shrink-0"
              aria-label="Status: Live"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Live</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 border border-gray-200/60 flex-shrink-0"
              aria-label="Status: Idle"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden="true" />
              <span>Idle</span>
            </span>
          )}
        </div>

        {/* Description */}
        <p
          className={`text-xs leading-relaxed line-clamp-2 mt-2 ${
            room.description ? "text-gray-600" : "text-gray-400 italic font-light"
          }`}
        >
          {room.description || "No description yet"}
        </p>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3.5 pt-3 border-t border-gray-50">
        {/* Participants Row */}
        <div className="flex items-center justify-between text-xs min-h-[22px]">
          {isLive ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5 overflow-hidden">
                {room.participants.slice(0, 3).map((p, idx) => (
                  <div
                    key={p.userId || idx}
                    title={p.username}
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white ${
                      AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length]
                    }`}
                  >
                    {p.username ? p.username.charAt(0).toUpperCase() : "U"}
                  </div>
                ))}
                {remainingParticipants > 0 && (
                  <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold text-gray-600 ring-2 ring-white">
                    +{remainingParticipants}
                  </div>
                )}
              </div>
              <span className="font-medium text-emerald-700">
                {room.participantCount} {room.participantCount === 1 ? "in room" : "in room"}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 font-normal flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" />
              <span>Be the first to join</span>
            </span>
          )}

          {room.capacity > 0 && (
            <span className="text-[11px] text-gray-400">
              {room.participantCount}/{room.capacity}
            </span>
          )}
        </div>

        {/* Footer: Public/Private pill + Join Button */}
        <div className="flex items-center justify-between gap-2">
          {/* Public / Private Pill */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              isPrivate
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60"
                : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60"
            }`}
          >
            {isPrivate ? (
              <Lock className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Globe className="h-3 w-3" aria-hidden="true" />
            )}
            <span>{isPrivate ? "Private" : "Public"}</span>
          </span>

          {/* Join / Full Button */}
          {isFull ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed"
            >
              Room full
            </button>
          ) : (
            <button
              type="button"
              onClick={handleJoinClick}
              disabled={isJoining}
              aria-label={`Join room ${room.name}`}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <span>Join</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

