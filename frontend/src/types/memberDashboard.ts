export interface RoomParticipantInfo {
  userId: string;
  username: string;
}

export interface ActiveRoom {
  _id: string;
  name: string;
  description: string;
  type: "public" | "private";
  status: "active" | "blocked";
  liveParticipants: RoomParticipantInfo[];
  participantCount: number;
  createdAt: string;
}

export interface UpcomingMeetingHost {
  _id: string;
  username: string;
  email: string;
}

export interface UpcomingMeeting {
  _id: string;
  title: string;
  description: string;
  meetingCode: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  host: UpcomingMeetingHost;
  participantsCount: number;
}

export interface DashboardAnnouncement {
  _id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "critical" | "event";
  isPinned: boolean;
  authorName: string;
  createdAt: string;
  isRead: boolean;
}

export interface RecentChatUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  isOnline?: boolean;
}

export interface RecentChatConversation {
  id: string;
  otherUser: RecentChatUser;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
    type: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface DashboardStats {
  roomsCount: number;
  upcomingMeetingsCount: number;
  unreadChatCount: number;
  unreadAnnouncementsCount: number;
}

export interface UserActivitySummary {
  hoursThisWeek: number;
  meetingsAttended: number;
}

export interface MemberDashboardSummary {
  organizationName: string;
  workspaceName: string;
  stats: DashboardStats;
  activeRooms: ActiveRoom[];
  upcomingMeetings: UpcomingMeeting[];
  announcements: DashboardAnnouncement[];
  recentChats: RecentChatConversation[];
  activity: UserActivitySummary;
}

export interface SectionState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

