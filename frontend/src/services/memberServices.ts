import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";
import type {
  MemberDashboardSummary,
  ActiveRoom,
  UpcomingMeeting,
  DashboardAnnouncement,
  RecentChatConversation,
} from "../types/memberDashboard";
import { getRooms } from "./roomServices";
import { getMeetings } from "./meetingServices";
import { getAnnouncements } from "./announcementServices";
import { getConversations } from "./directChatServices";

export const getMemberDashboardSummary = async (): Promise<MemberDashboardSummary> => {
  const res = await axiosInstance.get(API_ENDPOINTS.MEMBER.DASHBOARD_SUMMARY);
  return res.data.data;
};

// Granular independent fetchers for section retries & parallel fallback
export const fetchMemberRooms = async (): Promise<ActiveRoom[]> => {
  const res = await getRooms(1, 10);
  const data = res.data.data || res.data;
  const rawRooms = data.rooms || [];
  return rawRooms.map((r: { _id: string; name: string; description?: string; type: "public" | "private"; status: "active" | "blocked"; createdAt?: string }) => ({
    _id: r._id,
    name: r.name,
    description: r.description || "",
    type: r.type,
    status: r.status,
    liveParticipants: [],
    participantCount: 0,
    createdAt: r.createdAt || new Date().toISOString(),
  }));
};

export const fetchMemberMeetings = async (): Promise<UpcomingMeeting[]> => {
  const res = await getMeetings({ page: 1, limit: 10, status: "scheduled" });
  const data = res.data.data || res.data;
  const meetings = data.meetings || [];
  return meetings.map((m: {
    _id: string;
    title: string;
    description?: string;
    meetingCode: string;
    startTime: string;
    endTime: string;
    status: "scheduled" | "live" | "completed" | "cancelled";
    hostId?: { _id: string; username: string; email: string };
    participants?: { _id: string; username: string; email: string }[];
  }) => ({
    _id: m._id,
    title: m.title,
    description: m.description || "",
    meetingCode: m.meetingCode,
    startTime: m.startTime,
    endTime: m.endTime,
    status: m.status,
    host: {
      _id: m.hostId?._id || "",
      username: m.hostId?.username || "Host",
      email: m.hostId?.email || "",
    },
    participantsCount: Array.isArray(m.participants) ? m.participants.length : 0,
  }));
};

export const fetchMemberAnnouncements = async (userId?: string): Promise<DashboardAnnouncement[]> => {
  const res = await getAnnouncements(1, 10, "published");
  const data = res.data.data || res.data;
  const announcements = data.announcements || [];
  return announcements.map((a: {
    _id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "critical" | "event";
    isPinned?: boolean;
    createdBy?: { username?: string };
    createdAt?: string;
    readBy?: string[];
  }) => ({
    _id: a._id,
    title: a.title,
    content: a.content,
    type: a.type,
    isPinned: Boolean(a.isPinned),
    authorName: a.createdBy?.username || "Workspace Admin",
    createdAt: a.createdAt || new Date().toISOString(),
    isRead: Boolean(userId && a.readBy?.includes(userId)),
  }));
};

export const fetchMemberRecentChats = async (): Promise<RecentChatConversation[]> => {
  const conversations = await getConversations();
  return (conversations || []).slice(0, 5) as RecentChatConversation[];
};
