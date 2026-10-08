export interface GetAllUsersQueryDTO {
  workspaceId: string;
  page: number;
  limit: number;
  search?: string;
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
