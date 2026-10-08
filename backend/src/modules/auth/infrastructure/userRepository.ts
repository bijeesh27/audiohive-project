import { IuserRepository } from "../domain/IuserRepository.ts";
import { UserModel } from "../../../shared/User.utils/userSchema.ts";
import { IuserDTO } from "../../../shared/User.utils/userDTO.ts";
import { BaseRepository } from "../../../shared/common/baseRepository.ts";
import { RegisterDTO } from "../application/dtos/AuthDTO.ts";

export class UserRepository
  extends BaseRepository<IuserDTO>
  implements IuserRepository
{
  constructor() {
    super(UserModel);
  }
  async findByEmail(email: string): Promise<IuserDTO | null> {
    const user = await UserModel.findOne({ email });
    return user;
  }


  async createUser(data: RegisterDTO): Promise<void> {
    await this.create(data);
  }
  async deteleUser(id: string): Promise<void> {
    await this.delete(id);
  }
  async updateUser(
    userId: string,
    data: Partial<IuserDTO>,
  ): Promise<IuserDTO> {
    const updated = await this.model.findByIdAndUpdate(userId, data, { new: true });
    return updated as IuserDTO;
  }
}
