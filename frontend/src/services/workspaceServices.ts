import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";


export interface IWorkspaceRecentActivity {
  _id: string;
  action: string;
  actorName: string;
  occurredAt: string;
  details?: string;
}

export interface IWorkspaceItem {
  _id: string;
  workspaceName: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  organizationId?: string;
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
  recentActivities?: IWorkspaceRecentActivity[];
}

export interface IGetMyWorkspacesResponse {
  success: boolean;
  message: string;
  data: {
    workspaces: IWorkspaceItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    planUsage: {
      current: number;
      max: number | null;
      isLimitReached: boolean;
    };
  };
}

export const getAllWorkspaces = (page: number = 1, limit: number = 10, search: string = "") => {
  let url = `${API_ENDPOINTS.WORKSPACE.GET_ALL}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export const getMyWorkspaces = (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  status: string = "all",
  sort: string = "newest"
): Promise<IGetMyWorkspacesResponse> => {
  let url = `${API_ENDPOINTS.WORKSPACE.GET_MY}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  if (status && status !== "all") {
    url += `&status=${encodeURIComponent(status)}`;
  }
  if (sort) {
    url += `&sort=${encodeURIComponent(sort)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export const getMemberWorkspaces = () => {
  return axiosInstance.get(API_ENDPOINTS.WORKSPACE.GET_MEMBER_WORKSPACES).then((res) => res.data);
};

export const switchMemberWorkspace = (workspaceId: string) => {
  return axiosInstance
    .post(API_ENDPOINTS.AUTH.SWITCH_WORKSPACE, { workspaceId })
    .then((res) => res.data);
};

export const createWorkspace = (data: Record<string, unknown>) => {
  return axiosInstance.post(API_ENDPOINTS.WORKSPACE.CREATE, data).then((res) => res.data);
};

export const updateWorkspace = (
  workspaceId: string,
  data: {
    workspaceName?: string;
    slug?: string;
    status?: "active" | "suspended" | "archived";
    description?: string;
    workspaceAdminEmail?: string;
  }
) => {
  return axiosInstance
    .put(API_ENDPOINTS.WORKSPACE.UPDATE(workspaceId), data)
    .then((res) => res.data);
};

export const approveWorkspaceApi = (data: {
  workspaceId: string;
  adminEmail: string;
  workspaceName: string;
}) => {
  return axiosInstance
    .post(API_ENDPOINTS.SUPER_ADMIN.APPROVE_WORKSPACE, data)
    .then((res) => res.data);
};

export const inviteWorkspaceAdmin = (workspaceId: string, data: { email: string; workspaceAdminName: string }) => {
  return axiosInstance.post(API_ENDPOINTS.WORKSPACE.INVITE(workspaceId), data).then((res) => res.data);
};

export const inviteWorkspaceUser = (data: { email: string; invitedName: string; role: string }) => {
  return axiosInstance.post(API_ENDPOINTS.WORKSPACE_ADMIN.INVITE_USER, data).then((res) => res.data);
};

export const getWorkspace = (workspaceId: string) => {
  return axiosInstance.get(API_ENDPOINTS.WORKSPACE.GET_ONE(workspaceId)).then((res) => res.data);
};

export const blockWorkspace = (workspaceId: string, status: "active" | "suspended") => {
  return axiosInstance
    .put(API_ENDPOINTS.WORKSPACE.UPDATE(workspaceId), { status })
    .then((res) => res.data);
};

export const deleteWorkspace = (workspaceId: string) => {
  return axiosInstance
    .delete(API_ENDPOINTS.WORKSPACE.DELETE(workspaceId))
    .then((res) => res.data);
};

export interface IWorkspaceOverview {
  workspace: {
    _id: string;
    workspaceName: string;
    slug: string;
    status: "active" | "suspended" | "archived";
    description?: string;
    workspaceAdminEmail?: string;
    workspaceAdminName?: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
  };
  metrics?: {
    membersCount: number;
    membersLimit: number | null;
    onlineNow: number;
    roomsCount: number;
    roomsLimit: number | null;
    meetingsCount: number;
    totalMeetingDurationMinutes: number;
    meetingDurationFormatted: string;
    periodDays: number;
  };
  stats?: {
    membersCount: number;
    membersLimit: number | null;
    roomsCount: number;
    roomsLimit: number | null;
    onlineNow: number;
    meetingsCount30d: number;
    meetingDuration30d: string;
  };
  planUsage?: {
    planName: string;
    members: { current: number; max: number | null; percentage: number };
    rooms: { current: number; max: number | null; percentage: number };
  };
  planLimits?: {
    planName: string;
    maxUsers: number | null;
    maxRooms: number | null;
    maxWorkspaces: number | null;
  };
  activityChart: {
    date: string;
    label: string;
    actions: number;
    meetings: number;
  }[];
  recentActivities: {
    _id: string;
    action: string;
    actorName: string;
    occurredAt: string;
    details?: string;
  }[];
}

export interface IWorkspaceRoom {
  _id: string;
  name: string;
  type: "standard" | "lounge" | "public" | "private";
  status: "active" | "blocked";
  isDefault: boolean;
  membersCount: number;
  onlineNow: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IWorkspaceActivityItem {
  _id: string;
  action: string;
  actorId: string | null;
  actorName: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface IWorkspaceActivitiesResponse {
  success: boolean;
  message: string;
  data: {
    activities: IWorkspaceActivityItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getWorkspaceUsers = (
  workspaceId: string,
  page: number = 1,
  limit: number = 10,
  search: string = "",
  role: string = "",
  status: string = "",
  sortField: string = "",
  sortOrder: "asc" | "desc" = "desc"
) => {
  let url = `${API_ENDPOINTS.WORKSPACE.GET_USERS(workspaceId)}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  if (role && role !== "all") {
    url += `&role=${encodeURIComponent(role)}`;
  }
  if (status && status !== "all") {
    url += `&status=${encodeURIComponent(status)}`;
  }
  if (sortField) {
    url += `&sortField=${encodeURIComponent(sortField)}&sortOrder=${sortOrder}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export const getWorkspaceOverview = (workspaceId: string, days: number = 30): Promise<{ success: boolean; data: IWorkspaceOverview }> => {
  return axiosInstance.get(`${API_ENDPOINTS.WORKSPACE.GET_OVERVIEW(workspaceId)}?days=${days}`).then((res) => res.data);
};

export const getWorkspaceRooms = (workspaceId: string): Promise<{ success: boolean; data: IWorkspaceRoom[] }> => {
  return axiosInstance.get(API_ENDPOINTS.WORKSPACE.GET_ROOMS(workspaceId)).then((res) => res.data);
};

export const getWorkspaceActivities = (
  workspaceId: string,
  page: number = 1,
  limit: number = 10,
  search: string = ""
): Promise<IWorkspaceActivitiesResponse> => {
  let url = `${API_ENDPOINTS.WORKSPACE.GET_ACTIVITIES(workspaceId)}?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return axiosInstance.get(url).then((res) => res.data);
};

export const updateWorkspaceUserRole = (workspaceId: string, userId: string, role: string) => {
  return axiosInstance.patch(API_ENDPOINTS.WORKSPACE.UPDATE_USER_ROLE(workspaceId, userId), { role }).then((res) => res.data);
};

export const updateWorkspaceUserStatus = (workspaceId: string, userId: string, status: boolean) => {
  return axiosInstance.patch(API_ENDPOINTS.WORKSPACE.UPDATE_USER_STATUS(workspaceId, userId), { status }).then((res) => res.data);
};

export const removeWorkspaceUser = (workspaceId: string, userId: string) => {
  return axiosInstance.delete(API_ENDPOINTS.WORKSPACE.REMOVE_USER(workspaceId, userId)).then((res) => res.data);
};

export const getCompanyProfile = (workspaceId: string) => {
  return axiosInstance.get(`/api/workspace/${workspaceId}/company-profile`).then((res) => res.data);
};

export const updateCompanyProfile = (workspaceId: string, data: Record<string, unknown>) => {
  return axiosInstance.patch(`/api/workspace/${workspaceId}/company-profile`, data).then((res) => res.data);
};

export const addWorkspaceAnnouncement = (workspaceId: string, data: { title: string; body: string }) => {
  return axiosInstance.post(`/api/workspace/${workspaceId}/announcements`, data).then((res) => res.data);
};
