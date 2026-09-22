import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import { getUnreadCount } from "../services/announcementServices";

interface AnnouncementContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  decrementUnread: () => void;
}

const AnnouncementContext = createContext<AnnouncementContextType | null>(null);

const AnnouncementContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  // Initial fetch on mount
  useEffect(() => {
    getUnreadCount()
      .then((res) => {
        setUnreadCount(res.data.data?.unreadCount ?? 0);
      })
      .catch(() => {});
  }, []);

  // Centralised socket listeners — single place manages the badge count
  useEffect(() => {
    const onNew = () => setUnreadCount((c) => c + 1);
    const onDelete = () => setUnreadCount((c) => Math.max(0, c - 1));
    const onReconnect = () => {
      getUnreadCount()
        .then((res) => setUnreadCount(res.data.data?.unreadCount ?? 0))
        .catch(() => {});
    };

    socket.on("new-announcement", onNew);
    socket.on("delete-announcement", onDelete);
    socket.on("connect", onReconnect);

    return () => {
      socket.off("new-announcement", onNew);
      socket.off("delete-announcement", onDelete);
      socket.off("connect", onReconnect);
    };
  }, [socket]);

  const decrementUnread = () => setUnreadCount((c) => Math.max(0, c - 1));

  return (
    <AnnouncementContext.Provider value={{ unreadCount, setUnreadCount, decrementUnread }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncementContext = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error("useAnnouncementContext must be used inside AnnouncementContextProvider");
  }
  return context;
};

export default AnnouncementContextProvider;
