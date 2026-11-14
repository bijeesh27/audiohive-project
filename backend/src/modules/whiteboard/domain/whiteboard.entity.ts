export interface IStickyNoteCreator {
  userId: string;
  username: string;
  email?: string;
}

export interface IStickyNoteUpdater {
  userId: string;
  username: string;
}

export interface IStickyNote {
  id: string;
  roomId: string;
  workspaceId: string;
  content: string;
  positionX: number;
  positionY: number;
  color: string;
  createdBy: IStickyNoteCreator;
  updatedBy?: IStickyNoteUpdater;
  version: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

