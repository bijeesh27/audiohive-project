import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IorganizationDocument } from "../../infrastructure/organizationSchema";

export class GetAllOrganizationUseCase implements IuseCase<any,any>{
    constructor(
        private readonly organizationRepository:IorganizaionRepository
    ){}
    async execute(data: { page: number; limit: number,search?: string, sort?: string }): Promise<{ organizations: IorganizationDocument[], total: number }> {
        return await this.organizationRepository.getAllorganizations(data.page, data.limit,data.search, data.sort)
    }
}