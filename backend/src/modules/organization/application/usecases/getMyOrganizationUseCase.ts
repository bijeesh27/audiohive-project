import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IorganizationDocument } from "../../infrastructure/organizationSchema";
import { OrganizationNotFound } from "../../../../common/Errors/OrganizationError";

export class GetMyOrganizationUseCase implements IuseCase<string, IorganizationDocument> {
    constructor(private readonly organizationRepository: IorganizaionRepository) {}

    async execute(ownerEmail: string): Promise<IorganizationDocument> {
        const organization = await this.organizationRepository.findByOwnerEmail(ownerEmail);
        if (!organization) {
            throw new OrganizationNotFound()
        }
        return organization;
    }
}
