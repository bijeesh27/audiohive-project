import { UserRoles } from "../../../common/constant/userRoles.ts";
import { IuserDocument, UserModel } from "../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../domain/IuserRepository.ts";

export class UserRepository implements IuserRepository {
  async getAllUsers(page: number, limit: number): Promise<{ users: Array<IuserDocument>; total: number } | null> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      UserModel.find({role:UserRoles.MEMBER}).select('-password').skip(skip).limit(limit),
      UserModel.countDocuments()
    ]);

    return { users, total };
  }
}
