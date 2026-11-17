export interface GetAllUsersQueryDTO {
  workspaceId: string;
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface WorkspaceMemberStatsDTO {
  total: number;
  online: number;
  active: number;
  disabled: number;
}

export interface WorkspaceMemberRecordDTO {
  _id: string;
  userId: string;
  username: string;
  email: string;
  password?: string;
  role: string;
  status: boolean;
  isOnline: boolean;
  roomsCount: number;
  lastActiveAt: string | null;
  joinedAt: string;
  workspaceIds?: unknown[];
  workspaceId?: unknown;
}

export interface GetAllUsersResponseDTO {
  users: WorkspaceMemberRecordDTO[];
  total: number;
  page: number;
  totalPages: number;
  stats: WorkspaceMemberStatsDTO;
}

export interface SendUserInvitationDTO {
  workspaceId: string;
  email: string;
  invitedName: string;
  role: string;
  workspaceAdminEmail: string;
}

export interface UpdateUserRequestDTO {
  userId: string;
  updateData: Partial<import("../../../../shared/User.utils/userDTO.ts").IuserDTO>;
}

export interface WorkspaceDashboardStatsDTO {
  totalRooms: number;
  totalUsers: number;
}
