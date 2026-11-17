export type RoomType = "public" | "private" | "standard" | "lounge";
export type RoomTypeFilter = "all" | "public" | "private" | "live";
export type RoomSortOption = "active" | "newest" | "name";

export interface CompanyLink {
  label: string;
  url: string;
}

export interface WorkspaceAnnouncement {
  _id?: string;
  title: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

export interface CompanyProfile {
  name?: string;
  tagline?: string;
  about?: string;
  mission?: string;
  website?: string;
  logoUrl?: string;
  links: CompanyLink[];
  announcements: WorkspaceAnnouncement[];
}

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number; // in seconds
  coverUrl?: string;
  addedBy?: {
    userId: string;
    username: string;
  };
}

export interface PlaybackSnapshot {
  currentTrack: TrackItem | null;
  isPlaying: boolean;
  position: number;
  startedAt: number;
  serverTime: number;
  queue: TrackItem[];
  skipVotesCount: number;
  skipVotesRequired: number;
  hasVotedSkip: boolean;
}

export interface RoomParticipantSummary {
  userId: string;
  username: string;
  avatar?: string;
}

export interface MemberRoom {
  id: string;
  _id?: string;
  name: string;
  description: string;
  type: RoomType;
  isDefault?: boolean;
  settings?: {
    music?: {
      enabled: boolean;
    };
  };
  isLive: boolean;
  participantCount: number;
  capacity: number;
  participants: RoomParticipantSummary[];
  createdAt?: string;
}

export interface RoomTabCounts {
  all: number;
  public: number;
  private: number;
  live: number;
}

export interface MemberRoomsResponse {
  rooms: MemberRoom[];
  total: number;
  page: number;
  totalPages: number;
  counts: RoomTabCounts;
}

export interface MemberRoomsParams {
  q?: string;
  type?: RoomTypeFilter;
  sort?: RoomSortOption;
  page?: number;
  limit?: number;
}

export interface RoomDetailData {
  _id: string;
  id?: string;
  workspaceId?: string;
  name: string;
  description?: string;
  type: RoomType;
  isDefault?: boolean;
  settings?: {
    music?: {
      enabled: boolean;
    };
  };
  status: "active" | "blocked";
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  memberCount: number;
  onlineCount: number;
  myRole: "owner" | "admin" | "member";
  isLive?: boolean;
}

export interface ParticipantItem {
  _id: string;
  username: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: boolean;
  isOnline: boolean;
  joinedAt?: string;
  createdAt?: string;
}

export interface RoomDocumentItem {
  _id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploaderId?: { _id?: string; username?: string; email?: string } | string | null;
  createdAt: string;
  updatedAt?: string;
}


