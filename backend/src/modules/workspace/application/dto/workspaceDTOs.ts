export type WorkspaceStatus = "active" | "suspended" | "archived";

export interface CreateWorkspaceDTO {
  userEmail: string;
  workspaceName: string;
  slug: string;
}

export interface UpdateWorkspaceDTO {
  id: string;
  workspaceName?: string;
  slug?: string;
  status?: WorkspaceStatus;
}

export interface DeleteWorkspaceDTO {
  workspaceId: string;
}

export interface GetWorkspaceDTO {
  workspaceId: string;
}

export interface WorkspacePaginationDTO {
  page: number;
  limit: number;
  search?: string;
}

export interface GetWorkspacesByOrgDTO extends WorkspacePaginationDTO {
  userEmail: string;
}

export interface GetWorkspaceUsersDTO extends WorkspacePaginationDTO {
  workspaceId: string;
}

export interface RemoveWorkspaceUserDTO {
  workspaceId: string;
  userId: string;
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
}

export interface ResolvedWorkspaceDTO {
  workspaceId: string;
  organizationId: string;
}
