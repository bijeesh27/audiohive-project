import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export interface IuserRepository {
  getAllUsers(workspaceId: string, page: number, limit: number, searchQuery?: string): Promise<{ users: Array<IuserDocument>; total: number } | null>;
}
