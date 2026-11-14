import { IStickyNote } from "./whiteboard.entity.js";

export interface IWhiteboardRepository {
  findByRoomId(roomId: string): Promise<IStickyNote[]>;
  findById(id: string): Promise<IStickyNote | null>;
  create(data: Omit<IStickyNote, "id" | "createdAt" | "updatedAt">): Promise<IStickyNote>;
  update(
    id: string,
    data: Partial<Omit<IStickyNote, "id" | "roomId" | "workspaceId" | "createdBy" | "createdAt">>,
    expectedVersion?: number
  ): Promise<IStickyNote | null>;
  delete(id: string): Promise<boolean>;
  deleteAllInRoom(roomId: string): Promise<boolean>;
}

