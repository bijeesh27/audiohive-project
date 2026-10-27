import axiosInstance from "../config/axios";
import { API_ENDPOINTS } from "../constants/Api_Routes";

export interface MeetingUser {
  _id: string;
  username: string;
  email: string;
}

export interface Meeting {
  _id: string;
  title: string;
  description: string;
  workspaceId: string;
  hostId: MeetingUser;
  startTime: string;
  endTime: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  meetingCode: string;
  participants: MeetingUser[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  participants?: string[];
}

export interface UpdateMeetingPayload {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: "scheduled" | "live" | "completed" | "cancelled";
  participants?: string[];
}

export const getMeetings = (params?: { page?: number; limit?: number; status?: string }) => {
  return axiosInstance.get(API_ENDPOINTS.MEETING.GET_ALL, { params });
};

export const getMeeting = (id: string) => {
  return axiosInstance.get(API_ENDPOINTS.MEETING.GET_ONE(id));
};

export const createMeeting = (data: CreateMeetingPayload) => {
  return axiosInstance.post(API_ENDPOINTS.MEETING.CREATE, data);
};

export const updateMeeting = (id: string, data: UpdateMeetingPayload) => {
  return axiosInstance.put(API_ENDPOINTS.MEETING.UPDATE(id), data);
};

export const cancelMeeting = (id: string) => {
  return axiosInstance.patch(API_ENDPOINTS.MEETING.CANCEL(id));
};

export const deleteMeeting = (id: string) => {
  return axiosInstance.delete(API_ENDPOINTS.MEETING.DELETE(id));
};
