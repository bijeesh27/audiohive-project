import { UserRoles } from "../../../common/constant/userRoles.ts";
import { IuserDocument, UserModel } from "../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../domain/IuserRepository.ts";
import { OrganizationModel } from "../../organization/infrastructure/organizationSchema.ts";

export class UserRepository implements IuserRepository {
  async getAllUsers(page: number, limit: number,searchQuery?:string): Promise<{ users: Array<IuserDocument>; total: number } | null> {
    const skip = (page - 1) * limit;

    const query:Record<string, unknown> ={role:UserRoles.ORGANIZATION_OWNER};
    if(searchQuery){
        query.$or=[
            {username:{$regex:searchQuery,$options:'i'}},
            {email:{$regex:searchQuery,$options:'i'}},

        ]
    }
    
    const [users, total] = await Promise.all([
      UserModel.find(query).select('-password').skip(skip).limit(limit),
      UserModel.countDocuments(query)
    ]);

    return { users, total };
  }

  async getTotalOrganizations(): Promise<number> {
    return await OrganizationModel.countDocuments();
  }

  async getTotalUsers(): Promise<number> {
    return await UserModel.countDocuments({
      role: { $in: [UserRoles.ORGANIZATION_OWNER, UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER] }
    });
  }
}
