import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import type { Conversation, DirectMessage } from '../../services/directChatServices';
import type { OptimisticMessage } from './MessageBubble';
import { markConversationAsRead } from '../../services/directChatServices';

interface UseDirectChatSocketProps {
  socket: Socket | null;
  activeConversationId: string | null;
  userId?: string | null;
  refreshUnreadCount: () => void;
  setMessages: React.Dispatch<React.SetStateAction<OptimisticMessage[]>>;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setTypingUserName: (name: string | undefined) => void;
}

export function useDirectChatSocket({
  socket,
  activeConversationId,
  userId,
  refreshUnreadCount,
  setMessages,
  setConversations,
  setTypingUserName,
}: UseDirectChatSocketProps) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: DirectMessage) => {
      const isForActive = newMsg.conversationId === activeConversationId;

      if (isForActive) {
        setMessages((prev) => {
          const optIdx = prev.findIndex(
            (m) =>
              m.status === 'sending' &&
              m.content === newMsg.content &&
              m.senderId === newMsg.senderId
          );
          if (optIdx !== -1) {
            const next = [...prev];
            next[optIdx] = { ...newMsg, status: 'sent' };
            return next;
          }
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        if (document.visibilityState === 'visible') {
          markConversationAsRead(activeConversationId).catch(() => {});
          refreshUnreadCount();
        }
      }

      setConversations((prev) => {
        const found = prev.find((c) => c.id === newMsg.conversationId);
        const unreadInc = !isForActive && newMsg.senderId !== userId ? 1 : 0;
        const updatedItem: Conversation = found
          ? {
              ...found,
              lastMessage: {
                content: newMsg.content,
                senderId: newMsg.senderId,
                createdAt: newMsg.createdAt,
                type: newMsg.type,
              },
              unreadCount: isForActive ? 0 : found.unreadCount + unreadInc,
              updatedAt: newMsg.createdAt,
            }
          : {
              id: newMsg.conversationId,
              participants: [],
              otherUser: {
                _id: newMsg.senderId,
                username: 'Member',
                email: '',
                role: 'member',
              },
              lastMessage: {
                content: newMsg.content,
                senderId: newMsg.senderId,
                createdAt: newMsg.createdAt,
                type: newMsg.type,
              },
              unreadCount: isForActive ? 0 : 1,
              updatedAt: newMsg.createdAt,
            };

        return [updatedItem, ...prev.filter((c) => c.id !== newMsg.conversationId)];
      });
    };

    const handleMessagesRead = ({ conversationId }: { conversationId: string }) => {
      if (conversationId === activeConversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === userId ? { ...m, isRead: true, status: 'read' } : m))
        );
      }
    };

    const handleTyping = ({
      conversationId,
      username,
    }: {
      conversationId: string;
      username: string;
    }) => {
      if (conversationId === activeConversationId) {
        setTypingUserName(username);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUserName(undefined), 3000);
      }
    };

    const handleStopTyping = ({ conversationId }: { conversationId: string }) => {
      if (conversationId === activeConversationId) {
        setTypingUserName(undefined);
      }
    };

    socket.on('dm:new-message', handleNewMessage);
    socket.on('dm:messages-read', handleMessagesRead);
    socket.on('dm:typing', handleTyping);
    socket.on('dm:stop-typing', handleStopTyping);

    return () => {
      socket.off('dm:new-message', handleNewMessage);
      socket.off('dm:messages-read', handleMessagesRead);
      socket.off('dm:typing', handleTyping);
      socket.off('dm:stop-typing', handleStopTyping);
    };
  }, [socket, activeConversationId, userId, refreshUnreadCount, setMessages, setConversations, setTypingUserName]);
}

