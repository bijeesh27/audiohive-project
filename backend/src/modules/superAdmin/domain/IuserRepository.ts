import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export interface IuserRepository {
  getAllUsers(): Promise<Array<IuserDocument> | null>;
}
