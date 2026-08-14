import { UserNotFound } from "../../../../common/Errors/AuthError.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../../../auth/domain/IuserRepository.ts"; 

export class UpdateUserUseCase implements IuseCase<{ userId: string, updateData: Partial<IuserDocument> }, IuserDocument> {
  
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(data: { userId: string, updateData: Partial<IuserDocument> }): Promise<IuserDocument> {
    const { userId, updateData } = data;
    const updatedUser = await this.userRepository.updateUser(userId, updateData);
    
    if (!updatedUser) {
      throw new UserNotFound()
    }

    return updatedUser;
  }
}