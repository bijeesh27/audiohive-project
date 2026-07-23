import { IuserRepository } from "../domain/IuserRepository.ts";
import {
  IuserDocument,
  UserModel,
} from "../../../shared/User.utils/userSchema.ts";
import bcrypt from "bcrypt";
import { BaseRepository } from "../../../shared/common/baseRepository.ts";

export class UserRpository
  extends BaseRepository<IuserDocument>
  implements IuserRepository
{
  constructor() {
    super(UserModel);
  }
  async findByEmail(email: string): Promise<IuserDocument | null> {
    let user = await UserModel.findOne({ email });
    return user;
  }

  async createUser(data: IuserDocument): Promise<void> {
    const { username, email, password } = data;
    let passwordHash = await bcrypt.hash(password, 12);
    let newdata = {
      username,
      email,
      password: passwordHash,
    };
    console.log(newdata);
    await this.create(newdata);
  }
  async deteleUser(id: string): Promise<void> {
    await this.delete(id);
  }
  async updateUser(
    userId: string,
    data: IuserDocument,
  ): Promise<IuserDocument> {
    console.log("data from update user", data);
    await this.update(userId, data);
    return data;
  }
}
