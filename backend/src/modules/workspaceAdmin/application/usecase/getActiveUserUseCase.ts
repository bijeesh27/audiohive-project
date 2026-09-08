import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserRepository } from "../../domain/IuserRepository";


export class GetActiveUserUseCase implements IuseCase<any,any> {
    constructor(
        private readonly userRepository:IuserRepository
    ){}
    async execute(workspaceId:string){
        await this.userRepository.getActiveUsers(workspaceId)
    }
}