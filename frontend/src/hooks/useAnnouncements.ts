import { useEffect, useState, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { useAnnouncementContext } from "../context/AnnouncementContext";
import {
  getAnnouncements,
  markAsRead as markAsReadAPI,
  getUnreadCount,
} from "../services/announcementServices";

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "critical" | "event";
  targetAudience: "all" | "room-specific";
  status: "draft" | "published" | "archived";
  isPinned: boolean;
  readBy: string[];
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

export const useAnnouncements = () => {
  const { socket } = useSocket();
  const { unreadCount, setUnreadCount, decrementUnread } = useAnnouncementContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        getAnnouncements(1, 50, "published"),
        getUnreadCount(),
      ]);
      const items: Announcement[] =
        listRes.data.data?.announcements ?? listRes.data.data ?? [];
      setAnnouncements(items);
      // Sync the global unread count from server on fetch
      setUnreadCount(countRes.data.data?.unreadCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    // onNew only updates the list — count is handled by AnnouncementContext
    const onNew = (newItem: Announcement) => {
      setAnnouncements((prev) => {
        // Guard against duplicates (e.g. reconnect race)
        if (prev.some((a) => a._id === newItem._id)) return prev;
        return [newItem, ...prev];
      });
    };

    const onPin = ({
      announcementId,
      isPinned,
    }: {
      announcementId: string;
      isPinned: boolean;
    }) => {
      setAnnouncements((prev) =>
        [...prev]
          .map((a) => (a._id === announcementId ? { ...a, isPinned } : a))
          .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
      );
    };

    const onDelete = ({ announcementId }: { announcementId: string }) => {
      setAnnouncements((prev) => prev.filter((a) => a._id !== announcementId));
    };

    const onReconnect = () => {
      fetchAll();
    };

    socket.on("new-announcement", onNew);
    socket.on("pin-announcement", onPin);
    socket.on("delete-announcement", onDelete);
    socket.on("connect", onReconnect);

    return () => {
      socket.off("new-announcement", onNew);
      socket.off("pin-announcement", onPin);
      socket.off("delete-announcement", onDelete);
      socket.off("connect", onReconnect);
    };
  }, [socket, fetchAll]);

  const markAsRead = async (id: string) => {
    try {
      await markAsReadAPI(id);
      setAnnouncements((prev) =>
        prev.map((a) =>
          // Use the actual current user id from readBy — optimistic update
          // We mark with a sentinel then let the next fetch correct it
          a._id === id ? { ...a, readBy: [...a.readBy, "__read__"] } : a
        )
      );
      // Decrement the global badge count via context
      decrementUnread();
    } catch {
    }
  };

  return { announcements, unreadCount, loading, markAsRead, refetch: fetchAll };
};
