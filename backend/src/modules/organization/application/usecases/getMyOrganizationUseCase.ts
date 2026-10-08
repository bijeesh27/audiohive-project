import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IorganizationDocument } from "../../infrastructure/organizationSchema";
import { OrganizationNotFound } from "../../../../common/Errors/OrganizationError";
import { GetMyOrganizationDTO } from "../dto/organizationDTO";

export class GetMyOrganizationUseCase implements IuseCase<GetMyOrganizationDTO, IorganizationDocument> {
    constructor(private readonly organizationRepository: IorganizaionRepository) {}

    async execute({ ownerEmail }: GetMyOrganizationDTO): Promise<IorganizationDocument> {
        const organization = await this.organizationRepository.findByOwnerEmail(ownerEmail);
        if (!organization) {
            throw new OrganizationNotFound()
        }
        return organization;
    }
}
