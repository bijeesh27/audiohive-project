import { UserNotFound } from "../../../../common/Errors/Error.ts";
import { IuserDocument } from "../../../../shared/User.utils/userSchema.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";

export class ForgetUseCase{
    constructor (
        private readonly userRepository:IuserRepository
    ){}

    async excute(data:IuserDocument){
        const {email}=data
        const user=await this.userRepository.findByEmail(email)
        if(!user){
            throw new UserNotFound()
        }
        return user
    }

    

}