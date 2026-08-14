import { partial } from "zod/mini";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IorganizationDocument } from "../../infrastructure/organizationSchema";
import { updateOrganizationDTO } from "../dto/organizationDTO";

export class UpdateOrganizationUseCase implements IuseCase<updateOrganizationDTO,void>{
    constructor(
        private readonly organizationRepository:IorganizaionRepository
    ){}
    async execute(organizationId:string,data:Partial<IorganizationDocument>): Promise<void> {
        await this.organizationRepository.updateOrganization(organizationId,data)
    }
}