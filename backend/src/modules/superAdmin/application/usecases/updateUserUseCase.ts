import { UserNotFound } from "../../../../common/Errors/AuthError.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserDTO } from "../../../../shared/User.utils/userDTO.ts";
import { IuserRepository } from "../../../auth/domain/IuserRepository.ts";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { UpdateUserDTO } from "../dtos/SuperAdminDTO.ts";

export class UpdateUserUseCase implements IuseCase<UpdateUserDTO, IuserDTO> {
  
  constructor(private readonly userRepository: IuserRepository, private readonly activityLogRepository: IactivityLogRepository) {}

  async execute(data: UpdateUserDTO): Promise<IuserDTO> {
    const { userId, updateData } = data;
    const updatedUser = await this.userRepository.updateUser(userId, updateData);
    
    if (!updatedUser) {
      throw new UserNotFound()
    }

      await this.activityLogRepository.recordActivity({
        occurredAt: new Date(),
        action: "UPDATE_USER",
        actorId: null,
        targetType: "USER",
        targetId: userId,
        metadata: {},
      });


    return updatedUser;
  }
}
