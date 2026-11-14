import React from "react";
import type { RecentChatConversation } from "../../../types/memberDashboard";

function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  } catch {
    return "";
  }
}

interface ChatActivityItemProps {
  chat: RecentChatConversation;
  onClick: (conversationId: string) => void;
}

export const ChatActivityItem: React.FC<ChatActivityItemProps> = ({
  chat,
  onClick,
}) => {
  const other = chat.otherUser;
  const initial = (other?.username || "U").charAt(0).toUpperCase();
  const timeStr = getRelativeTime(chat.lastMessage?.createdAt || chat.updatedAt);
  const isUnread = (chat.unreadCount || 0) > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(chat.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(chat.id);
        }
      }}
      className={`group flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all cursor-pointer ${
        isUnread
          ? "border-indigo-100 bg-indigo-50/20 hover:border-indigo-200 hover:bg-indigo-50/40"
          : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/70"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm">
            {initial}
          </div>
          {other?.isOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h5 className="text-xs font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {other?.username || "Colleague"}
            </h5>
            {other?.role && other.role !== "member" && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                {other.role}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 truncate">
            {chat.lastMessage?.content || "No messages yet"}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px] font-medium text-gray-400">{timeStr}</span>
        {isUnread && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
          </span>
        )}
      </div>
    </div>
  );
};
