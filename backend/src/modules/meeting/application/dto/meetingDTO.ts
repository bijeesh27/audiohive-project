export interface CreateMeetingDTO {
  title: string;
  description?: string;
  startTime: string | Date;
  endTime: string | Date;
  hostId: string;
  workspaceId: string;
  participants?: string[];
}

export interface UpdateMeetingDTO {
  meetingId: string;
  workspaceId: string;
  userId: string;
  userRole: string;
  data: {
    title?: string;
    description?: string;
    startTime?: string | Date;
    endTime?: string | Date;
    status?: "scheduled" | "live" | "completed" | "cancelled";
    participants?: string[];
  };
}

export interface GetMeetingsDTO {
  workspaceId: string;
  userId?: string;
  userRole?: string;
  page?: number;
  limit?: number;
  status?: string;
}

export interface GetMeetingByIdDTO {
  meetingId: string;
  workspaceId?: string;
}

export interface CancelMeetingDTO {
  meetingId: string;
  workspaceId: string;
  userId: string;
  userRole: string;
}

export interface DeleteMeetingDTO {
  meetingId: string;
  workspaceId: string;
  userId: string;
  userRole: string;
}
