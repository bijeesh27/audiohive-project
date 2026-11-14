import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useUnreadCount } from "./useUnreadCount";
import { useDirectChat } from "../context/useDirectChat";
import type {
  ActiveRoom,
  UpcomingMeeting,
  DashboardAnnouncement,
  RecentChatConversation,
  DashboardStats,
  UserActivitySummary,
} from "../types/memberDashboard";
import {
  getMemberDashboardSummary,
  fetchMemberRooms,
  fetchMemberMeetings,
  fetchMemberAnnouncements,
  fetchMemberRecentChats,
} from "../services/memberServices";

export function useMemberDashboard() {
  const { userId, workspaceId } = useAuth();
  const { socket } = useSocket();
  const { unreadCount: liveAnnouncementUnread } = useUnreadCount();
  const { unreadCount: liveDmUnread } = useDirectChat();

  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState("AudioHive");
  const [stats, setStats] = useState<DashboardStats>({
    roomsCount: 0,
    upcomingMeetingsCount: 0,
    unreadChatCount: 0,
    unreadAnnouncementsCount: 0,
  });

  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const [meetings, setMeetings] = useState<UpcomingMeeting[]>([]);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);

  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);

  const [recentChats, setRecentChats] = useState<RecentChatConversation[]>([]);
  const [chatsError, setChatsError] = useState<string | null>(null);

  const [activity, setActivity] = useState<UserActivitySummary | undefined>(undefined);

  const fetchFullSummary = useCallback(async () => {
    setLoading(true);
    setRoomsError(null);
    setMeetingsError(null);
    setAnnouncementsError(null);
    setChatsError(null);

    try {
      const summary = await getMemberDashboardSummary();
      setOrganizationName(summary.organizationName || "AudioHive");
      setStats(summary.stats);
      setRooms(summary.activeRooms || []);
      setMeetings(summary.upcomingMeetings || []);
      setAnnouncements(summary.announcements || []);
      setRecentChats(summary.recentChats || []);
      setActivity(summary.activity);
    } catch {
      // Parallel independent fallback if aggregated endpoint fails
      const [roomsRes, meetingsRes, annRes, chatsRes] = await Promise.allSettled([
        fetchMemberRooms(),
        fetchMemberMeetings(),
        fetchMemberAnnouncements(userId || undefined),
        fetchMemberRecentChats(),
      ]);

      if (roomsRes.status === "fulfilled") {
        setRooms(roomsRes.value);
        setStats((prev) => ({ ...prev, roomsCount: roomsRes.value.length }));
      } else {
        setRoomsError("Unable to load rooms");
      }

      if (meetingsRes.status === "fulfilled") {
        setMeetings(meetingsRes.value);
        setStats((prev) => ({ ...prev, upcomingMeetingsCount: meetingsRes.value.length }));
      } else {
        setMeetingsError("Unable to load meetings");
      }

      if (annRes.status === "fulfilled") {
        setAnnouncements(annRes.value);
      } else {
        setAnnouncementsError("Unable to load announcements");
      }

      if (chatsRes.status === "fulfilled") {
        setRecentChats(chatsRes.value);
      } else {
        setChatsError("Unable to load conversations");
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const retryRooms = async () => {
    setRoomsError(null);
    try {
      const data = await fetchMemberRooms();
      setRooms(data);
      setStats((prev) => ({ ...prev, roomsCount: data.length }));
    } catch {
      setRoomsError("Failed to reload rooms. Please try again.");
    }
  };

  const retryMeetings = async () => {
    setMeetingsError(null);
    try {
      const data = await fetchMemberMeetings();
      setMeetings(data);
      setStats((prev) => ({ ...prev, upcomingMeetingsCount: data.length }));
    } catch {
      setMeetingsError("Failed to reload meetings. Please try again.");
    }
  };

  const retryAnnouncements = async () => {
    setAnnouncementsError(null);
    try {
      const data = await fetchMemberAnnouncements(userId || undefined);
      setAnnouncements(data);
    } catch {
      setAnnouncementsError("Failed to reload announcements. Please try again.");
    }
  };

  const retryChats = async () => {
    setChatsError(null);
    try {
      const data = await fetchMemberRecentChats();
      setRecentChats(data);
    } catch {
      setChatsError("Failed to reload chat conversations. Please try again.");
    }
  };

  useEffect(() => {
    fetchFullSummary();
  }, [fetchFullSummary, workspaceId]);

  // Keep stats in sync with live real-time counts
  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      unreadAnnouncementsCount: liveAnnouncementUnread,
      unreadChatCount: liveDmUnread,
    }));
  }, [liveAnnouncementUnread, liveDmUnread]);

  // Real-time socket updates for room presence
  useEffect(() => {
    if (!socket) return;
    const handlePresence = (onlineUsers: { userId: string; username: string }[]) => {
      setRooms((prev) =>
        prev.map((r) => {
          const matching = onlineUsers.filter((u) => Boolean(u.userId));
          return {
            ...r,
            liveParticipants: matching,
            participantCount: matching.length,
          };
        })
      );
    };

    socket.on("room:presence-update", handlePresence);
    return () => {
      socket.off("room:presence-update", handlePresence);
    };
  }, [socket]);

  return {
    loading,
    organizationName,
    stats,
    rooms,
    roomsError,
    retryRooms,
    meetings,
    meetingsError,
    retryMeetings,
    announcements,
    announcementsError,
    retryAnnouncements,
    recentChats,
    chatsError,
    retryChats,
    activity,
    refreshAll: fetchFullSummary,
  };
}
