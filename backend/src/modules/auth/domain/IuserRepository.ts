import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";

export interface IuserRepository {
  findByEmail(email: string): Promise<IuserDocument | null>;
  createUser(data: IuserDocument): Promise<void>;
  deteleUser(email: string): Promise<void>;
  updateUser(
    userId: string,
    data: Partial<IuserDocument>,
  ): Promise<IuserDocument>;
}
