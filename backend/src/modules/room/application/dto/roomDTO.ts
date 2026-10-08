import { IRoomDocument } from "../../infrastructure/roomSchema";

export interface CreateRoomDTO {
  organizationId: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: "public" | "private";
  isPrivate?: boolean;
  createdBy: string;
}

export interface UpdateRoomDTO {
  name?: string;
  description?: string;
  type?: "public" | "private";
  isPrivate?: boolean;
  status?: "active" | "blocked";
  allowedUsers?: string[];
  actorId?: string;
  workspaceId?: string;
  organizationId?: string;
}

export interface UpdateRoomRequestDTO {
  roomId: string;
  data: UpdateRoomDTO;
}

export interface DeleteRoomDTO {
  roomId: string;
}

export interface GetRoomDTO {
  roomId: string;
}

export interface GetAllRoomsDTO {
  workspaceId: string;
  page: number;
  limit: number;
  search?: string;
  userId?: string;
  role?: string;
}

export interface GetAllRoomsResultDTO {
  rooms: IRoomDocument[];
  total: number;
}

export interface GetRoomParticipantsDTO {
  roomId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface RoomParticipantDTO {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
}

export interface GetRoomParticipantsResultDTO {
  participants: RoomParticipantDTO[];
  total: number;
}

export interface AllocateRoomUsersDTO {
  roomId: string;
  userIds: string[];
  actorId: string;
  organizationId: string;
  workspaceId: string;
}

export interface RemoveRoomUserDTO {
  roomId: string;
  userId: string;
  actorId?: string;
  workspaceId?: string;
  organizationId?: string;
}
