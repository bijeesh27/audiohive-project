import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { getDirectChatUnreadCount } from "../services/directChatServices";
import { DirectChatContext } from "./directChatContextInstance";

export const DirectChatContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket, isConnected } = useSocket();
  const { isAuthenticated, userId } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getDirectChatUnreadCount();
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  const decrementUnread = useCallback((by: number = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - by));
  }, []);

  const isUserOnline = useCallback(
    (targetUserId: string) => (isAuthenticated ? onlineUserIds.has(targetUserId) : false),
    [isAuthenticated, onlineUserIds]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    getDirectChatUnreadCount()
      .then((res) => {
        if (!cancelled) {
          setUnreadCount(res.unreadCount || 0);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Update document title dynamically to reflect unread chat count
  useEffect(() => {
    if (!isAuthenticated) {
      document.title = "AudioHive";
      return;
    }
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) AudioHive`;
    } else {
      document.title = "AudioHive";
    }
  }, [isAuthenticated, unreadCount]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("dm:get-online-users", (activeIds: string[]) => {
      if (Array.isArray(activeIds)) {
        setOnlineUserIds(new Set(activeIds));
      }
    });

    const handleUnreadCount = ({ unreadCount: count }: { unreadCount: number }) => {
      setUnreadCount(count);
    };

    const handleNewMessage = (msg: { receiverId: string }) => {
      if (msg.receiverId === userId) {
        refreshUnreadCount();
      }
    };

    const handleUserStatusChanged = ({ userId: id, isOnline }: { userId: string; isOnline: boolean }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    };

    const handleOnlineUsers = (activeIds: string[]) => {
      if (Array.isArray(activeIds)) {
        setOnlineUserIds(new Set(activeIds));
      }
    };

    socket.on("dm:unread-count", handleUnreadCount);
    socket.on("dm:new-message", handleNewMessage);
    socket.on("user:status-changed", handleUserStatusChanged);
    socket.on("dm:online-users", handleOnlineUsers);

    return () => {
      socket.off("dm:unread-count", handleUnreadCount);
      socket.off("dm:new-message", handleNewMessage);
      socket.off("user:status-changed", handleUserStatusChanged);
      socket.off("dm:online-users", handleOnlineUsers);
    };
  }, [socket, isConnected, userId, refreshUnreadCount]);

  const value = useMemo(
    () => ({
      unreadCount: isAuthenticated ? unreadCount : 0,
      onlineUserIds: isAuthenticated ? onlineUserIds : new Set<string>(),
      isUserOnline,
      refreshUnreadCount,
      decrementUnread,
    }),
    [isAuthenticated, unreadCount, onlineUserIds, isUserOnline, refreshUnreadCount, decrementUnread]
  );

  return <DirectChatContext.Provider value={value}>{children}</DirectChatContext.Provider>;
};

export default DirectChatContextProvider;
