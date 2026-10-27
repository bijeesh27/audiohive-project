import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { getDirectChatUnreadCount } from "../services/directChatServices";

interface DirectChatContextType {
  unreadCount: number;
  onlineUserIds: Set<string>;
  isUserOnline: (userId: string) => boolean;
  refreshUnreadCount: () => Promise<void>;
  decrementUnread: (by?: number) => void;
}

const DirectChatContext = createContext<DirectChatContextType | null>(null);

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
    (targetUserId: string) => onlineUserIds.has(targetUserId),
    [onlineUserIds]
  );

  useEffect(() => {
    if (isAuthenticated) {
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
      setOnlineUserIds(new Set());
    }
  }, [isAuthenticated, refreshUnreadCount]);

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

  return (
    <DirectChatContext.Provider
      value={{
        unreadCount,
        onlineUserIds,
        isUserOnline,
        refreshUnreadCount,
        decrementUnread,
      }}
    >
      {children}
    </DirectChatContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDirectChat = () => {
  const context = useContext(DirectChatContext);
  if (!context) {
    throw new Error("useDirectChat must be used inside DirectChatContextProvider");
  }
  return context;
};

export default DirectChatContextProvider;
