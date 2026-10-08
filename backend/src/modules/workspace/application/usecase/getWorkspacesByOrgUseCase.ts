import { OrganizationNotFound } from "../../../../common/Errors/OrganizationError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { GetWorkspacesByOrgDTO } from "../dto/workspaceDTOs";

interface Output {
    workspaces: IWorkspaceDocument[];
    total: number;
}

export class GetWorkspacesByOrgUseCase implements IuseCase<GetWorkspacesByOrgDTO, Output> {
    constructor(
        private readonly workspaceRepository: IworkspaceRepository,
        private readonly organizationRepository: IorganizaionRepository,
    ) {}

    async execute(data: GetWorkspacesByOrgDTO): Promise<Output> {
        const organization = await this.organizationRepository.findByOwnerEmail(data.userEmail);
        if (!organization) {
            throw new OrganizationNotFound()
        }

        return await this.workspaceRepository.getWorkspacesByOrg(
            String(organization._id),
            data.page,
            data.limit,
            data.search,
        );
    }
}
