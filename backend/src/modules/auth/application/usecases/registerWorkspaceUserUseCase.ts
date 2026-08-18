import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository.ts";
import { RegisterDTO } from "../dtos/AuthDTO.ts";
import { InvalidOtpError } from "../../../../common/Errors/AuthError.ts";
import bcrypt from "bcrypt";

export class RegisterWorkspaceUserUseCase implements IuseCase<any, void> {
    constructor(
        private readonly userRepository: IuserRepository,
        private readonly workspaceRepository: IworkspaceRepository
    ) {}

    async execute(data: any) {
        const { token, username, password } = data;
        
        // Find workspace invitation
        const invitation = await this.workspaceRepository.findInvitationByToken(token);
        
        if (!invitation || invitation.isUsed || invitation.expiresAt < new Date() || !invitation.role) {
            throw new InvalidOtpError();
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const newUser: RegisterDTO = {
            username,
            email: invitation.email,
            password: hashedPassword,
            role: invitation.role,
        };

        const userData = { ...newUser, workspaceId: invitation.workspaceId };
        
        await this.userRepository.createUser(userData as any);
        
        // Mark invitation as used
        await this.workspaceRepository.updateInvitation(token, { isUsed: true });
    }
}
