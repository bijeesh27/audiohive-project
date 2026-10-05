import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserDocument } from "../../../../shared/User.utils/userSchema";
import { IuserRepository } from "../../../workspaceAdmin/domain/IuserRepository";
import { AppError } from "../../../../common/Errors/AppError";

export class RemoveWorkspaceUserUseCase
  implements IuseCase<{ workspaceId: string; userId: string }, IuserDocument>
{
  constructor(private readonly userRepository: IuserRepository) {}

  async execute(
    data: { workspaceId: string; userId: string }
  ): Promise<IuserDocument> {
    const { userId } = data;

    // We update the user to set their workspaceId to null
    // The repository handles pulling them from rooms
    const updateData: Partial<IuserDocument> = {
      workspaceId: null,
    };

    const updatedUser = await this.userRepository.updateUser(
      userId,
      updateData
    );

    if (!updatedUser) {
      throw new AppError("User not found or update failed", 404);
    }

    return updatedUser;
  }
}