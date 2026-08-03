import { IuserDocument, UserModel } from "../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../domain/IuserRepository.ts";

export class UserRepository implements IuserRepository {
  async getAllUsers(): Promise<Array<IuserDocument> | null> {
    const users = await UserModel.find().select('-password');
    return users;
  }
}
