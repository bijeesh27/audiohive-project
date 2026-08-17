import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserRepository } from "../../domain/IuserRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { InvalidOtpError } from "../../../../common/Errors/AuthError";
import bcrypt from "bcrypt";

export class RegisterOwnerUseCase implements IuseCase<any, void> {
    constructor(
        private readonly userRepository: IuserRepository,
        private readonly organizationRepository: IorganizaionRepository
    ) {}

    async execute(data: any) {
        const { token, username, password } = data;
        
        // Find organization invitation
        const invitation = await this.organizationRepository.findInvitationByToken(token);
        
        if (!invitation) {
            throw new InvalidOtpError();
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create organization owner user
        const newOwner = {
            username: invitation.ownerName, // Alternatively use `username` from data if desired, but retaining existing logic
            email: invitation.ownerEmail,
            password: hashedPassword,
            role: "organization-owner",
        };
        
        await this.userRepository.createUser(newOwner as any);
        
        // Mark invitation as used (delete it)
        await this.organizationRepository.deleteInvitation(token);
    }
}