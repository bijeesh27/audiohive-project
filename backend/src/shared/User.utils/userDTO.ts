export interface IuserDTO {
  _id: string;
  username: string;
  email: string;
  password:string;
  role: string;
  status: boolean;
  workspaceIds?: unknown[];
  /** @deprecated Read only during migration from the single-workspace model. */
  workspaceId?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}
