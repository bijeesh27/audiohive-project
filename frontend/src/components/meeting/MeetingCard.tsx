import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Copy,
  Check,
  Video,
  Globe,
} from "lucide-react";
import { MeetingActionsMenu } from "./MeetingActionsMenu";
import type { MeetingItem } from "../../types/meetings";

interface MeetingCardProps {
  meeting: MeetingItem;
  currentTime: Date;
  onEdit: (meeting: MeetingItem) => void;
  onCancel: (meeting: MeetingItem) => void;
  onDelete: (meeting: MeetingItem) => void;
  onJoin: (meeting: MeetingItem) => void;
}

const AVATAR_BG_COLORS = [
  "bg-indigo-600",
  "bg-purple-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-sky-600",
];

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  currentTime,
  onEdit,
  onCancel,
  onDelete,
  onJoin,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const startDate = new Date(meeting.startTime);
  const endDate = new Date(meeting.endTime);

  // Time calculations
  const durationMinutes = Math.max(
    0,
    Math.round((endDate.getTime() - startDate.getTime()) / 60000)
  );
  const durationText =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ""}`
      : `${durationMinutes} min`;

  // Formatted date & time
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const formattedTimeRange = `${startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Time-aware state computation
  const isCancelled = meeting.status === "cancelled";
  const isCompleted = meeting.status === "completed" || currentTime > endDate;
  const isLiveNow = !isCancelled && !isCompleted && currentTime >= startDate;
  const diffMinutes = Math.floor((startDate.getTime() - currentTime.getTime()) / 60000);
  const canJoinNow = !isCancelled && !isCompleted && diffMinutes <= 10;

  let timeAwareBadge: { label: string; className: string; isLive?: boolean };
  let joinDisabledReason = "";

  if (isCancelled) {
    timeAwareBadge = { label: "Cancelled", className: "bg-red-50 text-red-700 ring-1 ring-red-200/60" };
    joinDisabledReason = "This meeting has been cancelled";
  } else if (isCompleted) {
    timeAwareBadge = { label: "Ended", className: "bg-gray-100 text-gray-500" };
    joinDisabledReason = "This meeting has already ended";
  } else if (isLiveNow) {
    timeAwareBadge = {
      label: "Live now",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 font-semibold",
      isLive: true,
    };
  } else if (diffMinutes <= 60) {
    timeAwareBadge = {
      label: `Starts in ${Math.max(1, diffMinutes)} min`,
      className: "bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-200/60",
    };
    if (!canJoinNow) joinDisabledReason = "Join opens 10 minutes before start";
  } else {
    const hours = Math.floor(diffMinutes / 60);
    timeAwareBadge = {
      label: `Starts in ${hours} ${hours === 1 ? "hr" : "hrs"}`,
      className: "bg-gray-50 text-gray-500 border border-gray-200/60 font-medium",
    };
    joinDisabledReason = "Join opens 10 minutes before start";
  }

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(meeting.meetingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const hostName = meeting.host?.name || meeting.hostId?.username || "Host";
  const attendeesList = meeting.attendees || meeting.participants || [];
  const remainingAttendees = Math.max(0, meeting.attendeeCount - 3);

  return (
    <div
      role="article"
      aria-label={`Meeting: ${meeting.title}`}
      className="group relative flex flex-col justify-between h-[236px] rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md focus-within:ring-2 focus-within:ring-indigo-500/30"
    >
      {/* Top Row: Status badge, Copy Code pill, and Overflow Menu */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {/* Time-Aware Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${timeAwareBadge.className}`}
            >
              {timeAwareBadge.isLive && (
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
              <span>{timeAwareBadge.label}</span>
            </span>

            {/* Code Chip with Copy */}
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copy meeting code"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/80 bg-gray-50/80 hover:bg-gray-100 px-2.5 py-0.5 text-xs font-mono text-gray-600 transition-colors cursor-pointer"
            >
              <span>{meeting.meetingCode}</span>
              {copiedCode ? (
                <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="h-3 w-3 text-gray-400" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Host Overflow Menu */}
          {meeting.isHost && (
            <MeetingActionsMenu
              meetingId={meeting.id || meeting._id}
              meetingCode={meeting.meetingCode}
              isCancelled={isCancelled}
              isCompleted={isCompleted}
              onEdit={() => onEdit(meeting)}
              onCancel={() => onCancel(meeting)}
              onDelete={() => onDelete(meeting)}
            />
          )}
        </div>

        {/* Title */}
        <h3
          title={meeting.title}
          className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors"
        >
          {meeting.title}
        </h3>

        {/* Description (hidden if empty) */}
        {meeting.description ? (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {meeting.description}
          </p>
        ) : null}
      </div>

      {/* Meta & Footer */}
      <div className="space-y-3 pt-3 border-t border-gray-50">
        {/* Date, Time, Duration & Timezone */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1.5 font-medium text-gray-700">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
            <span>{formattedDate}</span>
          </span>

          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
            <span>{formattedTimeRange}</span>
            <span className="text-[11px] text-gray-400">({durationText})</span>
          </span>

          {localTimezone && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-400">
              <Globe className="h-3 w-3" aria-hidden="true" />
              <span>{localTimezone.split("/").pop()?.replace(/_/g, " ")}</span>
            </span>
          )}
        </div>

        {/* Host Avatar + Attendees + Join Button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Host info and Attendees */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Host avatar */}
            <div
              title={`Host: ${hostName}`}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold ring-2 ring-white flex-shrink-0"
            >
              {hostName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                {hostName}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight">Host</p>
            </div>

            {/* Attendees Stack */}
            {attendeesList.length > 0 && (
              <div className="flex -space-x-1.5 ml-2 overflow-hidden items-center">
                {attendeesList.slice(0, 3).map((a, idx) => (
                  <div
                    key={a.id || idx}
                    title={a.name || "Attendee"}
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white ${
                      AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length]
                    }`}
                  >
                    {(a.name || "A").charAt(0).toUpperCase()}
                  </div>
                ))}
                {remainingAttendees > 0 && (
                  <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold text-gray-600 ring-2 ring-white">
                    +{remainingAttendees}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Join Call Button */}
          {canJoinNow ? (
            <button
              type="button"
              onClick={() => onJoin(meeting)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 cursor-pointer"
            >
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Join Call</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={joinDisabledReason}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed"
            >
              <Video className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
              <span>Join Call</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
