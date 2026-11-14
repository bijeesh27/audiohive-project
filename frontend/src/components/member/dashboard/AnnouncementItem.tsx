import React from "react";
import { Info, AlertTriangle, Zap, CalendarDays } from "lucide-react";
import type { DashboardAnnouncement } from "../../../types/memberDashboard";

const TYPE_CONFIG = {
  info: { label: "Info", icon: Info, color: "bg-blue-50 text-blue-700 ring-blue-100", dot: "bg-blue-500" },
  warning: { label: "Warning", icon: AlertTriangle, color: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-500" },
  important: { label: "Warning", icon: AlertTriangle, color: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-500" },
  critical: { label: "Alert", icon: Zap, color: "bg-red-50 text-red-700 ring-red-100", dot: "bg-red-500" },
  urgent: { label: "Alert", icon: Zap, color: "bg-red-50 text-red-700 ring-red-100", dot: "bg-red-500" },
  event: { label: "Event", icon: CalendarDays, color: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
};

function getRelativeTime(dateStr: string): string {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "";
  }
}

interface AnnouncementItemProps {
  announcement: DashboardAnnouncement;
  onClick: (announcement: DashboardAnnouncement) => void;
}

export const AnnouncementItem: React.FC<AnnouncementItemProps> = ({
  announcement,
  onClick,
}) => {
  const config = TYPE_CONFIG[announcement.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
  const timeStr = getRelativeTime(announcement.createdAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(announcement)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(announcement);
        }
      }}
      className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer ${
        announcement.isRead
          ? "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/70"
          : "border-indigo-100 bg-indigo-50/20 hover:border-indigo-200 hover:bg-indigo-50/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${config.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`}></span>
            {config.label}
          </span>
          {announcement.isPinned && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
              Pinned
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!announcement.isRead && (
            <span className="h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-indigo-100" title="Unread"></span>
          )}
          <span className="text-[11px] font-medium text-gray-400">{timeStr}</span>
        </div>
      </div>

      <h4 className="mt-2 text-xs font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
        {announcement.title}
      </h4>
      <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
        {announcement.content}
      </p>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100/60">
        <span>By <strong className="font-medium text-gray-600">{announcement.authorName}</strong></span>
        <span className="text-indigo-600 font-medium group-hover:underline">Read details →</span>
      </div>
    </div>
  );
};
