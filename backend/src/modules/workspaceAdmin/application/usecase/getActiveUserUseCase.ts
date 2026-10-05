import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserRepository } from "../../domain/IuserRepository";


export class GetActiveUserUseCase implements IuseCase<string, number> {
    constructor(
        private readonly userRepository:IuserRepository
    ){}
    async execute(workspaceId:string): Promise<number> {
        return await this.userRepository.getActiveUsers(workspaceId)
    }
}