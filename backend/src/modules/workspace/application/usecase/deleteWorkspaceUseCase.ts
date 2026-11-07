import { MESSAGES } from "../../../../common/constant/messages";
import { CreateWorkspaceError } from "../../../../common/Errors/WorkspaceError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { DeleteWorkspaceDTO } from "../dto/workspaceDTOs";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class DeleteWorkspaceUseCase implements IuseCase<DeleteWorkspaceDTO,void>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository, private readonly activityLogRepository: IactivityLogRepository
    ){}

    async execute(data?: DeleteWorkspaceDTO): Promise<void> {
        if (!data || !data.workspaceId) throw new CreateWorkspaceError(MESSAGES.ERRORS.WORKSPACE_INVALID_ID)
        await this.workspaceRepository.deleteWorkspace(data.workspaceId);

        await this.activityLogRepository.recordActivity({
          occurredAt: new Date(),
          action: "DELETE_WORKSPACE",
          actorId: null,
          workspaceId: data.workspaceId,
          targetType: "WORKSPACE",
          targetId: data.workspaceId,
          metadata: {},
        });
    }
}
