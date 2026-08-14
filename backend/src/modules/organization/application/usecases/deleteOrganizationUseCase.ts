import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";

export class DeleteOrganizationUseCase implements IuseCase<any,void>{
    constructor(
        private readonly organizationRepository:IorganizaionRepository
    ){}
    async execute(organizationId:string): Promise<void> {
        await this.organizationRepository.deleteOrganization(organizationId)
    }
}