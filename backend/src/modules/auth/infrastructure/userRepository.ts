import { IuserRepository } from "../domain/IuserRepository.ts";
import { IuserDocument, UserModel } from "../../../shared/User.utils/userSchema.ts";
import bcrypt from "bcrypt";

export class UserRpository implements IuserRepository {
  async findByEmail(email: string): Promise<IuserDocument | null> {
    let user = await UserModel.findOne({ email });
    return user;
  }

  async createUser(data: IuserDocument): Promise<void> {
    const { name, email, password } = data;
    let passwordHash = await bcrypt.hash(password, 12);
    let newdata = {
      name,
      email,
      password: passwordHash,
    };
    console.log(newdata);
    await UserModel.create(newdata);
  }
  async deteleUser(email: string): Promise<void> {
    await UserModel.deleteOne({ email });
  }
}
