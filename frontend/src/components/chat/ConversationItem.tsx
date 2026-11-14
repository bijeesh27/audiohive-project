import React from "react";
import { formatConversationTime } from "./chatUtils";
import type { Conversation } from "../../services/directChatServices";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isOnline: boolean;
  currentUserId?: string | null;
  onSelect: (conversationId: string) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  isOnline,
  currentUserId,
  onSelect,
}) => {
  const otherUser = conversation.otherUser;
  const username = otherUser?.username || "Unknown";
  const userInitial = username.charAt(0).toUpperCase();

  const isLastMessageMine = Boolean(
    conversation.lastMessage?.senderId &&
      currentUserId &&
      conversation.lastMessage.senderId === currentUserId
  );

  const rawPreview = conversation.lastMessage?.content || "No messages yet";
  const previewText = isLastMessageMine ? `You: ${rawPreview}` : rawPreview;

  const timeString = formatConversationTime(
    conversation.lastMessage?.createdAt || conversation.updatedAt
  );

  const hasUnread = (conversation.unreadCount || 0) > 0;
  const unreadBadgeText = conversation.unreadCount > 9 ? "9+" : String(conversation.unreadCount);

  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={() => onSelect(conversation.id)}
      className={`group relative flex items-center gap-3 w-full px-4 py-3 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:bg-indigo-50/80 ${
        isActive
          ? "bg-indigo-50/80 border-l-4 border-indigo-600 pl-3 shadow-2xs"
          : "hover:bg-gray-50/80 border-l-4 border-transparent"
      }`}
    >
      {/* Avatar with Presence Indicator Dot */}
      <div className="relative flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 font-semibold text-xs text-indigo-700 ring-2 ring-white">
          {userInitial}
        </div>
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${
            isOnline ? "bg-emerald-500" : "bg-gray-300"
          }`}
          title={isOnline ? "Online" : "Offline"}
        />
      </div>

      {/* Info & Last Message Preview */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4
            className={`text-xs truncate ${
              hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-800"
            }`}
          >
            {username}
          </h4>

          {timeString && (
            <span
              className={`text-[11px] whitespace-nowrap flex-shrink-0 ${
                hasUnread ? "font-bold text-indigo-600" : "text-gray-400"
              }`}
            >
              {timeString}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate leading-relaxed ${
              hasUnread ? "font-semibold text-gray-900" : "text-gray-500"
            }`}
          >
            {previewText}
          </p>

          {/* Unread Indigo Badge */}
          {hasUnread && (
            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full shadow-2xs">
              {unreadBadgeText}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

