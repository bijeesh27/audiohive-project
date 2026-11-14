export type MeetingTab = "upcoming" | "past" | "cancelled";
export type MeetingStatus = "scheduled" | "live" | "completed" | "cancelled";

export interface MeetingHost {
  id: string;
  _id?: string;
  name: string;
  username?: string;
  email: string;
  avatar?: string;
}

export interface MeetingAttendee {
  id: string;
  _id?: string;
  name: string;
  username?: string;
  email: string;
  avatar?: string;
}

export interface MeetingItem {
  id: string;
  _id: string;
  code: string;
  meetingCode: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: MeetingStatus;
  host: MeetingHost;
  hostId?: { _id: string; username: string; email: string };
  attendees: MeetingAttendee[];
  participants?: { _id: string; username: string; email: string }[];
  attendeeCount: number;
  isHost: boolean;
  workspaceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingTabCounts {
  upcoming: number;
  past: number;
  cancelled: number;
}

export interface GetMeetingsParams {
  tab?: MeetingTab;
  q?: string;
  page?: number;
  limit?: number;
  status?: string;
}

export interface GetMeetingsResponse {
  meetings: MeetingItem[];
  total: number;
  page: number;
  totalPages: number;
  counts: MeetingTabCounts;
}

