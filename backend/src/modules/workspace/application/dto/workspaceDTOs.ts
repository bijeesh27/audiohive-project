export type WorkspaceStatus = "active" | "suspended" | "archived";

export interface CreateWorkspaceDTO {
  userEmail: string;
  workspaceName: string;
  slug: string;
  description?: string;
  workspaceAdminEmail?: string;
}

export interface UpdateWorkspaceDTO {
  id: string;
  userEmail?: string;
  workspaceName?: string;
  slug?: string;
  status?: WorkspaceStatus;
  description?: string;
  workspaceAdminEmail?: string;
}

export interface DeleteWorkspaceDTO {
  workspaceId: string;
  userEmail?: string;
}

export interface GetWorkspaceDTO {
  workspaceId: string;
}

export interface WorkspacePaginationDTO {
  page: number;
  limit: number;
  search?: string;
  status?: "all" | WorkspaceStatus;
  sort?: "newest" | "oldest" | "name" | "members";
}

export interface GetWorkspacesByOrgDTO extends WorkspacePaginationDTO {
  userEmail: string;
}

export interface EnrichedWorkspaceDTO {
  _id: string;
  workspaceName: string;
  slug: string;
  status: WorkspaceStatus;
  workspaceAdminEmail?: string;
  workspaceAdminName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  membersCount: number;
  membersLimit: number | null;
  roomsCount: number;
  onlineNow: number;
  lastActivityAt: string | null;
  meetingsCount30d: number;
  meetingDuration30d: string;
  recentActivities?: Array<{
    _id: string;
    action: string;
    actorName: string;
    occurredAt: string;
    details?: string;
  }>;
}

export interface WorkspacesListOutputDTO {
  workspaces: EnrichedWorkspaceDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  planUsage: {
    current: number;
    max: number | null;
    isLimitReached: boolean;
  };
}

export interface GetWorkspaceUsersDTO extends WorkspacePaginationDTO {
  workspaceId: string;
  ownerEmail: string;
  role?: string;
  status?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface UpdateWorkspaceUserRoleDTO {
  workspaceId: string;
  userId: string;
  role: string;
  ownerEmail: string;
  actorId: string;
}

export interface UpdateWorkspaceUserStatusDTO {
  workspaceId: string;
  userId: string;
  status: boolean;
  ownerEmail: string;
  actorId: string;
}

export interface WorkspaceOverviewDTO {
  workspace: {
    _id: string;
    workspaceName: string;
    slug: string;
    status: WorkspaceStatus;
    organizationId: string;
    workspaceAdminEmail?: string;
    workspaceAdminName?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    membersCount: number;
    membersLimit: number | null;
    roomsCount: number;
    roomsLimit: number | null;
    onlineNow: number;
    meetingsCount30d: number;
    meetingDuration30d: string;
  };
  metrics?: {
    membersCount: number;
    membersLimit: number | null;
    roomsCount: number;
    roomsLimit: number | null;
    onlineNow: number;
    meetingsCount: number;
    totalMeetingDurationMinutes: number;
    meetingDurationFormatted: string;
    periodDays: number;
  };
  planLimits: {
    planName: string;
    maxUsers: number | null;
    maxRooms: number | null;
    maxWorkspaces: number | null;
  };
  planUsage?: {
    planName: string;
    members: { current: number; max: number | null; percentage: number };
    rooms: { current: number; max: number | null; percentage: number };
  };
  activityChart: Array<{
    date: string;
    label?: string;
    actions: number;
    meetings: number;
  }>;
  recentActivities: Array<{
    _id: string;
    action: string;
    actorName: string;
    occurredAt: string;
    details?: string;
  }>;
}

export interface RemoveWorkspaceUserDTO {
  workspaceId: string;
  userId: string;
  ownerEmail: string;
  actorId: string;
}

export interface SendWorkspaceInvitationDTO {
  workspaceId: string;
  email: string;
  workspaceAdminName: string;
  organizationOwnerEmail: string;
}

export interface ResolveWorkspaceDTO {
  userId?: string;
  userEmail?: string;
  role?: string;
  activeWorkspaceId?: string;
}

export interface ResolvedWorkspaceDTO {
  workspaceId: string;
  organizationId: string;
}
