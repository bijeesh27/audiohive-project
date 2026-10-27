import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Hash,
  Copy,
  Check,
  Ban,
  Trash2,
  Video,
} from "lucide-react";
import type { Meeting } from "../../services/meetingServices";

interface MeetingCardProps {
  meeting: Meeting;
  currentUserId?: string | null;
  userRole?: string | null;
  onCancel?: (meetingId: string) => void;
  onDelete?: (meetingId: string) => void;
  onJoin?: (meeting: Meeting) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  currentUserId,
  userRole,
  onCancel,
  onDelete,
  onJoin,
}) => {
  const [copied, setCopied] = useState(false);

  const isHost =
    meeting.hostId?._id === currentUserId ||
    (typeof meeting.hostId === "string" && meeting.hostId === currentUserId);
  const isAdmin = userRole && userRole !== "member";
  const canManage = isHost || isAdmin;

  const startDate = new Date(meeting.startTime);
  const endDate = new Date(meeting.endTime);

  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = `${startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  const copyCode = () => {
    navigator.clipboard.writeText(meeting.meetingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (meeting.status) {
      case "live":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Now
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
            Cancelled
          </span>
        );
      case "scheduled":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4">
      {/* Top row: Status and Actions */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            type="button"
            onClick={copyCode}
            title="Copy Meeting Code"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-mono text-gray-600 transition-colors"
          >
            <span>{meeting.meetingCode}</span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>

        {canManage && meeting.status !== "cancelled" && (
          <div className="flex items-center gap-1">
            {onCancel && (
              <button
                type="button"
                onClick={() => onCancel(meeting._id)}
                title="Cancel Meeting"
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(meeting._id)}
                title="Delete Meeting"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Title & Agenda */}
      <div>
        <h3 className="text-base font-bold text-gray-900 line-clamp-1">{meeting.title}</h3>
        {meeting.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {meeting.description}
          </p>
        )}
      </div>

      {/* Date & Time pills */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <span className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-4 h-4 text-indigo-500" />
          {formattedDate}
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <Clock className="w-4 h-4 text-indigo-500" />
          {formattedTime}
        </span>
      </div>

      {/* Footer: Host, Participants & Join Button */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
            {meeting.hostId?.username ? meeting.hostId.username[0].toUpperCase() : "H"}
          </div>
          <div className="text-xs">
            <p className="font-medium text-gray-800 leading-tight">
              {meeting.hostId?.username || "Host"}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Open via code
            </p>
          </div>
        </div>

        {meeting.status !== "cancelled" && meeting.status !== "completed" && onJoin && (
          <button
            type="button"
            onClick={() => onJoin(meeting)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Join Call</span>
          </button>
        )}
      </div>
    </div>
  );
};
