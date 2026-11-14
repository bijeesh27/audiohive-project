import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { OptimisticMessage } from './MessageBubble';
import { DateSeparator } from './DateSeparator';
import { TypingIndicator } from './TypingIndicator';
import { EmptyConversationView } from './ChatEmptyState';
import { isSameDay, isWithinFiveMinutes } from './chatUtils';

interface MessageListProps {
  messages: OptimisticMessage[];
  currentUserId: string;
  otherUser: { username: string; role?: string };
  isLoadingOlder: boolean;
  hasMoreOlder: boolean;
  onLoadOlder: () => Promise<void>;
  onRetryMessage?: (msg: OptimisticMessage) => void;
  onSendGreeting?: (greeting: string) => void;
  typingUserName?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  otherUser,
  isLoadingOlder,
  hasMoreOlder,
  onLoadOlder,
  onRetryMessage,
  onSendGreeting,
  typingUserName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isNearBottomRef = useRef(true);
  const prevMessagesLength = useRef(messages.length);

  const checkScrollPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom <= 120;
    setShowScrollBottom(distanceFromBottom > 150);

    // Trigger load older messages when scrolled near top
    if (el.scrollTop <= 60 && hasMoreOlder && !isLoadingOlder) {
      const prevScrollHeight = el.scrollHeight;
      onLoadOlder().then(() => {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight - prevScrollHeight;
          }
        });
      });
    }
  }, [hasMoreOlder, isLoadingOlder, onLoadOlder]);

  // Handle new message arrival scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (messages.length > prevMessagesLength.current) {
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom on conversation load
  useEffect(() => {
    const el = containerRef.current;
    if (el && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
    }
  }, [otherUser.username]);

  const scrollToBottom = () => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      setShowScrollBottom(false);
    }
  };

  if (messages.length === 0) {
    return (
      <EmptyConversationView
        otherUserName={otherUser.username}
        onSendGreeting={onSendGreeting}
      />
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-[#F8F9FB]">
      <div
        ref={containerRef}
        onScroll={checkScrollPosition}
        className="h-full overflow-y-auto px-4 py-4 space-y-1 overscroll-contain"
      >
        {isLoadingOlder && (
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 text-xs text-slate-500 shadow-2xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Loading earlier messages...</span>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMine = msg.senderId === currentUserId;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

          const showDateSeparator = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

          const isFirstInGroup =
            !prevMsg ||
            prevMsg.senderId !== msg.senderId ||
            !isWithinFiveMinutes(prevMsg.createdAt, msg.createdAt) ||
            showDateSeparator;

          const isLastInGroup =
            !nextMsg ||
            nextMsg.senderId !== msg.senderId ||
            !isWithinFiveMinutes(msg.createdAt, nextMsg.createdAt) ||
            !isSameDay(msg.createdAt, nextMsg.createdAt);

          return (
            <React.Fragment key={msg.id}>
              {showDateSeparator && <DateSeparator date={msg.createdAt} />}
              <MessageBubble
                message={msg}
                isMine={isMine}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                otherUser={otherUser}
                onRetry={onRetryMessage}
              />
            </React.Fragment>
          );
        })}

        {typingUserName && <TypingIndicator userName={typingUserName} />}
      </div>

      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-md hover:bg-indigo-700 transition cursor-pointer"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>New messages</span>
        </button>
      )}
    </div>
  );
};
