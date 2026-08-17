import { HttpStatus } from "../../../../common/constant/httpStatus";
import { MESSAGES } from "../../../../common/constant/messages";
import { AppError } from "../../../../common/Errors/AppError";
import { CreateWorkspaceError } from "../../../../common/Errors/WorkspaceError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { createWorkspaceDTO } from "../dto/workspaceDTOs";

export class CreateWorkspaceUseCase implements IuseCase<createWorkspaceDTO, void> {
    constructor(
        private readonly workspaceRepository: IworkspaceRepository,
        private readonly organizationRepository: IorganizaionRepository,
    ) {}

    async execute(data?: createWorkspaceDTO): Promise<void> {
        if (!data) {
            throw new CreateWorkspaceError(MESSAGES.ERRORS.WORKSPACE_INVALID_DATA);
        }

        const organization = await this.organizationRepository.findByOwnerEmail(data.userEmail);
        if (!organization) {
            throw new AppError("No organization found for this user", HttpStatus.NOT_FOUND);
        }

        await this.workspaceRepository.createWorkspace({
            organizationId: organization._id,
            workspaceName: data.workspaceName,
            slug: data.slug,
        } as unknown as IWorkspaceDocument);
    }
}