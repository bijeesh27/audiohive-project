import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, X, MessageSquare, AlertCircle } from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import { ConversationListSkeleton } from "./ChatSkeleton";
import type { Conversation } from "../../services/directChatServices";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  error?: string | null;
  currentUserId?: string | null;
  isUserOnline: (userId: string) => boolean;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
  onRetry?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  loading,
  error,
  currentUserId,
  isUserOnline,
  onSelectConversation,
  onOpenNewChat,
  onRetry,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Filter conversations by contact name and last message content
  const filtered = useMemo(() => {
    if (!debouncedQuery) return conversations;
    return conversations.filter((c) => {
      const name = c.otherUser?.username?.toLowerCase() || "";
      const content = c.lastMessage?.content?.toLowerCase() || "";
      return name.includes(debouncedQuery) || content.includes(debouncedQuery);
    });
  }, [conversations, debouncedQuery]);

  return (
    <aside
      aria-label="Conversation list"
      className="flex flex-col h-full bg-white border-r border-gray-100 flex-shrink-0 w-full md:w-[340px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Messages</h2>
        </div>

        <button
          type="button"
          onClick={onOpenNewChat}
          title="Start new conversation"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-gray-50 flex-shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            role="searchbox"
            aria-label="Search conversations"
            placeholder="Search messages..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-200/80 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50" role="listbox">
        {loading ? (
          <ConversationListSkeleton count={6} />
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-600 space-y-2">
            <AlertCircle className="w-5 h-5 mx-auto text-red-500" />
            <p>{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="font-semibold underline hover:text-red-700 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 ring-1 ring-indigo-100">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-semibold text-gray-900">
              {debouncedQuery ? "No conversations match search" : "No conversations yet"}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
              {debouncedQuery
                ? "Try searching for a different name or keyword."
                : "Connect and chat with colleagues in your organization."}
            </p>
            {!debouncedQuery && (
              <button
                type="button"
                onClick={onOpenNewChat}
                className="mt-4 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              isOnline={isUserOnline(conv.otherUser?._id)}
              currentUserId={currentUserId}
              onSelect={onSelectConversation}
            />
          ))
        )}
      </div>
    </aside>
  );
};

