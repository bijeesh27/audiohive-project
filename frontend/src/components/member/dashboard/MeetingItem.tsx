import React from "react";
import { Video, Clock, User } from "lucide-react";
import type { UpcomingMeeting } from "../../../types/memberDashboard";

interface MeetingItemProps {
  meeting: UpcomingMeeting;
  onJoin: (meeting: UpcomingMeeting) => void;
}

export const MeetingItem: React.FC<MeetingItemProps> = ({ meeting, onJoin }) => {
  const startDate = new Date(meeting.startTime);
  const now = new Date();
  const diffMinutes = Math.round((startDate.getTime() - now.getTime()) / (1000 * 60));

  let timeBadge = { text: "", color: "bg-gray-100 text-gray-700" };
  const isHappeningNow = meeting.status === "live" || (diffMinutes <= 0 && diffMinutes >= -60);

  if (isHappeningNow) {
    timeBadge = { text: "Live Now", color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" };
  } else if (diffMinutes > 0 && diffMinutes <= 60) {
    timeBadge = { text: `Starts in ${diffMinutes}m`, color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
  } else {
    timeBadge = {
      text: startDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      color: "bg-indigo-50 text-indigo-700",
    };
  }

  const formattedTime = !isNaN(startDate.getTime())
    ? startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "Scheduled";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-indigo-100 hover:bg-gray-50/50">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100 font-bold text-sm">
          <Video className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{meeting.title}</h4>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${timeBadge.color}`}>
              {timeBadge.text}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-gray-600">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {formattedTime}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-gray-400" />
              {meeting.host?.username || "Host"}
            </span>
            {meeting.meetingCode && (
              <span className="font-mono text-[11px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                Code: {meeting.meetingCode}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onJoin(meeting)}
        className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-colors self-stretch sm:self-center flex-shrink-0 ${
          isHappeningNow
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {isHappeningNow ? "Join Call" : "View"}
      </button>
    </div>
  );
};
