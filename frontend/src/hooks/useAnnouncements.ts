import { useEffect, useState, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
      setUnreadCount(countRes.data.data?.unreadCount ?? 0);
    } catch {
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const onNew = (newItem: Announcement) => {
      setAnnouncements((prev) => [newItem, ...prev]);
      setUnreadCount((c) => c + 1);
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
          a._id === id ? { ...a, readBy: [...a.readBy, "me"] } : a
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
    }
  };

  return { announcements, unreadCount, loading, markAsRead, refetch: fetchAll };
};
