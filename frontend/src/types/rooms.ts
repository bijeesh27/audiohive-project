export type RoomType = "public" | "private";
export type RoomTypeFilter = "all" | "public" | "private" | "live";
export type RoomSortOption = "active" | "newest" | "name";

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

