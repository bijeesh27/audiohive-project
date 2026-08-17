import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IorganizationDocument } from "../../infrastructure/organizationSchema";
import { AppError } from "../../../../common/Errors/AppError";

export class GetMyOrganizationUseCase implements IuseCase<string, IorganizationDocument> {
    constructor(private readonly organizationRepository: IorganizaionRepository) {}

    async execute(ownerEmail: string): Promise<IorganizationDocument> {
        const organization = await this.organizationRepository.findByOwnerEmail(ownerEmail);
        if (!organization) {
            throw new AppError("Organization not found for this user", 404);
        }
        return organization;
    }
}
