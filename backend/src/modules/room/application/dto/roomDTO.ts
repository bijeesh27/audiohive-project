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
}

export interface AllocateRoomUsersDTO {
  roomId: string;
  userIds: string[];
}

export interface RemoveRoomUserDTO {
  roomId: string;
  userId: string;
}
