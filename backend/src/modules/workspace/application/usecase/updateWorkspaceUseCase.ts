import { MESSAGES } from "../../../../common/constant/messages";
import { CreateWorkspaceError } from "../../../../common/Errors/WorkspaceError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { UpdateWorkspaceDTO } from "../dto/workspaceDTOs";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";

export class updateWorkspaceUsecase implements IuseCase<UpdateWorkspaceDTO,void>{
    constructor(
        private readonly workspaceRepository:IworkspaceRepository, private readonly activityLogRepository: IactivityLogRepository
    ){}
    async execute(data?: UpdateWorkspaceDTO): Promise<void> {
        if (!data || !data.id) throw new CreateWorkspaceError(MESSAGES.ERRORS.WORKSPACE_INVALID_ID)
        const { id, ...updateData } = data;
        try {
            await this.workspaceRepository.updateWorkspace(id, updateData as Partial<IWorkspaceDocument>);
        } catch (error: unknown) {
          if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                "keyPattern" in error
            ) {
                const mongoError = error as {
                    code?: number;
                    keyPattern?: {
                        slug?: unknown;
                    };
                };

                if (
                    mongoError.code === 11000 &&
                    mongoError.keyPattern?.slug
                ) {
                    throw new CreateWorkspaceError(
                        "Workspace slug is already in use"
                    );
                }
            }

            throw error;
        }

        await this.activityLogRepository.recordActivity({
              occurredAt: new Date(),
              action: "UPDATE_WORKSPACE",
              actorId: data ? (data as any).actorId || (data as any).userId || (data as any).uploaderId || null : null,
              organizationId: data ? (data as any).organizationId : undefined,
              workspaceId: data ? (data as any).workspaceId || (data as any).roomId : undefined,
              targetType: "UPDATE",
              targetId: undefined,
              metadata: {}
            });
    }
}
