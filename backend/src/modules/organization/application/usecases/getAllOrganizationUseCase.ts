import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IorganizationDocument } from "../../infrastructure/organizationSchema";

export class GetAllOrganizationUseCase implements IuseCase<IorganizationDocument,void>{
    constructor(
        private readonly organizationRepository:IorganizaionRepository
    ){}
    async execute(): Promise<void> {
        await this.organizationRepository.getAllorganizations()
    }
}