import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";
import { RegisterDTO } from "../application/dtos/AuthDTO.ts";

export interface IuserRepository {
  findByEmail(email: string): Promise<IuserDTO | null>;
  createUser(data: RegisterDTO): Promise<void>;
  deteleUser(id: string): Promise<void>;
  findById(id: string): Promise<IuserDTO | null>;
  updateUser(
    userId: string,
    data: Partial<IuserDTO>,
  ): Promise<IuserDTO>;
}
