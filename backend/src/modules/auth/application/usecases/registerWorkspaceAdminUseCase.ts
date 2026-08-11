import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserRepository } from "../../domain/IuserRepository";
import { RegisterDTO } from "../dtos/AuthDTO";

export class RegisterWorkspaceAdminUseCase implements IuseCase<RegisterDTO,void>{
    constructor(
        private readonly userRepository:IuserRepository
    ){}
    async execute(data:RegisterDTO){
        await this.userRepository.createUser(data)
    }
}