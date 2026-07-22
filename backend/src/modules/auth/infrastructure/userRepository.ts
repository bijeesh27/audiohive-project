import { IuserRepository } from "../domain/IuserRepository.ts";
import { IuserDocument, UserModel } from "../../../shared/User.utils/userSchema.ts";
import bcrypt from "bcrypt";

export class UserRpository implements IuserRepository {
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
    await UserModel.create(newdata);
  }
  async deteleUser(email: string): Promise<void> {
    await UserModel.deleteOne({ email });
  }
  async updateUser(userId:string,data: IuserDocument): Promise<IuserDocument> {
    console.log('data from update user',data)
    await UserModel.updateOne({_id:userId},{$set:data})
    return data
  }

  async getUser(){
    let user=await UserModel.find().sort({createdAt:-1}).limit(2)
    return user
  }
}
