import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { IorganizationDocument } from "../../infrastructure/organizationSchema";
import { createOrganizationDTO } from "../dto/organizationDTO";

export class CreateOrganizationUseCase implements IuseCase<createOrganizationDTO,void>{
    constructor(
        private readonly oragnizationRepository:IorganizaionRepository
    ){}
    async execute(data:createOrganizationDTO){
        
         await this.oragnizationRepository.createOrganization(data)
    }
}