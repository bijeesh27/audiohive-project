import { HttpStatus } from "../../../../common/constant/httpStatus";
import { AppError } from "../../../../common/Errors/AppError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";

interface Input {
    userEmail: string;
    page: number;
    limit: number;
    search?: string;
}

interface Output {
    workspaces: IWorkspaceDocument[];
    total: number;
}

export class GetWorkspacesByOrgUseCase implements IuseCase<Input, Output> {
    constructor(
        private readonly workspaceRepository: IworkspaceRepository,
        private readonly organizationRepository: IorganizaionRepository,
    ) {}

    async execute(data: Input): Promise<Output> {
        const organization = await this.organizationRepository.findByOwnerEmail(data.userEmail);
        if (!organization) {
            throw new AppError("No organization found for this user", HttpStatus.NOT_FOUND);
        }

        return await this.workspaceRepository.getWorkspacesByOrg(
            String(organization._id),
            data.page,
            data.limit,
            data.search,
        );
    }
}
