export interface IuserDTO {
  _id: string;
  username: string;
  email: string;
  password:string;
  role: string;
  status: boolean;
  workspaceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
