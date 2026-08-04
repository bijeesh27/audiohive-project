import { IuserRepository } from "../domain/IuserRepository.ts";
import {
  IuserDocument,
  UserModel,
} from "../../../shared/User.utils/userSchema.ts";
import { BaseRepository } from "../../../shared/common/baseRepository.ts";

export class UserRpository
  extends BaseRepository<IuserDocument>
  implements IuserRepository
{
  constructor() {
    super(UserModel);
  }
  async findByEmail(email: string): Promise<IuserDocument | null> {
    const user = await UserModel.findOne({ email });
    return user;
  }

  async createUser(data: IuserDocument): Promise<void> {
    await this.create(data);
  }
  async deteleUser(id: string): Promise<void> {
    await this.delete(id);
  }
  async updateUser(
    userId: string,
    data: IuserDocument,
  ): Promise<IuserDocument> {
    await this.update(userId, data);
    return data;
  }
}
