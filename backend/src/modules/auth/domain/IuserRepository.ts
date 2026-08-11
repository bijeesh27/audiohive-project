import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";
import { RegisterDTO } from "../application/dtos/AuthDTO.ts";

export interface IuserRepository {
  findByEmail(email: string): Promise<IuserDocument | null>;
  createUser(data: RegisterDTO): Promise<void>;
  deteleUser(id: string): Promise<void>;
  updateUser(
    userId: string,
    data: Partial<IuserDocument>,
  ): Promise<IuserDocument>;

}
