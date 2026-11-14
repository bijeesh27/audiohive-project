import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useDirectChat } from '../../context/useDirectChat';
import type { Conversation } from '../../services/directChatServices';
import {
  getConversations,
  getConversationMessages,
  sendDirectMessage,
  markConversationAsRead,
} from '../../services/directChatServices';
import type { OptimisticMessage } from './MessageBubble';
import { useDirectChatSocket } from './useDirectChatSocket';

export function useDirectChatState(activeConversationId: string | null) {
  const { socket, isConnected } = useSocket();
  const { userId } = useAuth();
  const { refreshUnreadCount } = useDirectChat();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string | undefined>();

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const data = await getConversations();
      setConversations(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );
  const otherUser = useMemo(() => activeConversation?.otherUser || null, [activeConversation]);

  // Load initial messages for active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);

    getConversationMessages(activeConversationId, { limit: 30 })
      .then((data) => {
        if (cancelled) return;
        setMessages(data.messages || []);
        setHasMoreOlder(!!data.hasMore);
        markConversationAsRead(activeConversationId).catch(() => {});
        refreshUnreadCount();
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => { cancelled = true; };
  }, [activeConversationId, refreshUnreadCount]);

  // Load older messages (cursor pagination)
  const handleLoadOlder = useCallback(async () => {
    if (!activeConversationId || isLoadingOlder || !hasMoreOlder || messages.length === 0) return;
    const oldestId = messages[0]?.id;
    if (!oldestId) return;

    try {
      setIsLoadingOlder(true);
      const data = await getConversationMessages(activeConversationId, { before: oldestId, limit: 30 });
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMoreOlder(!!data.hasMore);
    } catch {
      // ignore
    } finally {
      setIsLoadingOlder(false);
    }
  }, [activeConversationId, isLoadingOlder, hasMoreOlder, messages]);

  // Sockets
  useDirectChatSocket({
    socket,
    activeConversationId,
    userId,
    refreshUnreadCount,
    setMessages,
    setConversations,
    setTypingUserName,
  });

  // Send message
  const handleSendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!activeConversationId || !otherUser || !userId) return false;

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMsg: OptimisticMessage = {
        id: tempId,
        conversationId: activeConversationId,
        senderId: userId,
        receiverId: otherUser._id,
        content,
        type: 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
        status: 'sending',
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const sent = await sendDirectMessage({
          conversationId: activeConversationId,
          receiverId: otherUser._id,
          content,
          type: 'text',
        });

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...sent, status: 'sent' } : m))
        );

        setConversations((prev) => {
          const found = prev.find((c) => c.id === activeConversationId);
          if (!found) return prev;
          const updated: Conversation = {
            ...found,
            lastMessage: {
              content,
              senderId: userId,
              createdAt: sent.createdAt,
              type: 'text',
            },
            updatedAt: sent.createdAt,
          };
          return [updated, ...prev.filter((c) => c.id !== activeConversationId)];
        });

        return true;
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
        );
        return false;
      }
    },
    [activeConversationId, otherUser, userId]
  );

  const handleRetryMessage = useCallback(
    async (msg: OptimisticMessage) => {
      if (!activeConversationId || !otherUser) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'sending' } : m))
      );

      try {
        const sent = await sendDirectMessage({
          conversationId: activeConversationId,
          receiverId: otherUser._id,
          content: msg.content,
          type: 'text',
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...sent, status: 'sent' } : m))
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'failed' } : m))
        );
      }
    },
    [activeConversationId, otherUser]
  );

  const emitTyping = useCallback(() => {
    if (socket && activeConversationId) {
      socket.emit('dm:typing', { conversationId: activeConversationId });
    }
  }, [socket, activeConversationId]);

  const emitStopTyping = useCallback(() => {
    if (socket && activeConversationId) {
      socket.emit('dm:stop-typing', { conversationId: activeConversationId });
    }
  }, [socket, activeConversationId]);

  return {
    conversations,
    setConversations,
    loadingConversations,
    messages,
    loadingMessages,
    isLoadingOlder,
    hasMoreOlder,
    activeConversation,
    otherUser,
    typingUserName,
    isConnected,
    handleSendMessage,
    handleRetryMessage,
    handleLoadOlder,
    emitTyping,
    emitStopTyping,
  };
}
