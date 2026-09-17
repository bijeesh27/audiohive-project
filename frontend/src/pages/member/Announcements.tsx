import { useAuth } from "../../context/AuthContext";
import { useAnnouncements } from "../../hooks/useAnnouncements";
import type { Announcement } from "../../hooks/useAnnouncements";
import { markAsRead } from "../../services/announcementServices";
import { useState } from "react";
import {
  Megaphone,
  Pin,
  Info,
  AlertTriangle,
  Zap,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";

const TYPE_CONFIG = {
  info: { label: "Info", icon: Info, color: "bg-blue-50 text-blue-700", border: "border-l-blue-500", dot: "bg-blue-500" },
  warning: { label: "Warning", icon: AlertTriangle, color: "bg-amber-50 text-amber-700", border: "border-l-amber-500", dot: "bg-amber-500" },
  critical: { label: "Critical", icon: Zap, color: "bg-red-50 text-red-700", border: "border-l-red-500", dot: "bg-red-500" },
  event: { label: "Event", icon: CalendarDays, color: "bg-green-50 text-green-700", border: "border-l-green-500", dot: "bg-green-500" },
};

export default function MemberAnnouncements() {
  const { accessToken } = useAuth();
  const { announcements, unreadCount, loading, markAsRead: markRead } = useAnnouncements();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const userId = (() => {
    try {
      const payload = accessToken?.split(".")[1];
      if (!payload) return "";
      return JSON.parse(atob(payload))?.id ?? "";
    } catch {
      return "";
    }
  })();

  const isRead = (a: Announcement) => a.readBy?.includes(userId);

  const pinned = announcements.filter((a) => a.isPinned && a.status === "published");
  const rest = announcements.filter((a) => !a.isPinned && a.status === "published");

  const handleExpand = async (a: Announcement) => {
    const nextId = expandedId === a._id ? null : a._id;
    setExpandedId(nextId);
    if (nextId && !isRead(a)) {
      await markRead(a._id);
    }
  };

  const renderCard = (a: Announcement) => {
    const cfg = TYPE_CONFIG[a.type];
    const Icon = cfg.icon;
    const read = isRead(a);
    const expanded = expandedId === a._id;

    return (
      <div
        key={a._id}
        className={`bg-white border border-gray-200 rounded-xl shadow-sm border-l-4 ${cfg.border} transition-all`}
      >
        <button
          className="w-full text-left p-4"
          onClick={() => handleExpand(a)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              {/* Unread dot */}
              {!read && (
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
              )}
              <div className={`p-1.5 rounded-lg ${cfg.color.split(" ")[0]}`}>
                <Icon className={`w-4 h-4 ${cfg.color.split(" ")[1]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${read ? "text-gray-500" : "text-gray-900"}`}>
                    {a.title}
                  </span>
                  {a.isPinned && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                {!expanded && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-1">{a.content}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(a.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-50 pt-3">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{a.content}</p>
            {read ? (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Marked as read
              </div>
            ) : (
              <button
                onClick={() => markRead(a._id)}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark as read
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Megaphone className="w-6 h-6 text-indigo-600" />
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Pinned section */}
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                📌 Pinned
              </p>
              <div className="space-y-3">
                {pinned.map(renderCard)}
              </div>
            </div>
          )}

          {/* All other announcements */}
          {rest.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Recent
                </p>
              )}
              <div className="space-y-3">
                {rest.map(renderCard)}
              </div>
            </div>
          )}

          {pinned.length === 0 && rest.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Megaphone className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-base font-medium text-gray-500">No announcements yet</p>
              <p className="text-sm mt-1">Your workspace admin will post updates here</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
