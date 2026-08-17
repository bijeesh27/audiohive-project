import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserRepository } from "../../domain/IuserRepository";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository";
import { RegisterDTO } from "../dtos/AuthDTO";
import { InvalidOtpError } from "../../../../common/Errors/AuthError";
import { UserRoles } from "../../../../common/constant/userRoles";
import bcrypt from "bcrypt";

export class RegisterWorkspaceAdminUseCase implements IuseCase<any, void> {
    constructor(
        private readonly userRepository: IuserRepository,
        private readonly workspaceRepository: IworkspaceRepository
    ) {}

    async execute(data: any) {
        const { token, username, password } = data;
        
        // Find workspace invitation
        const invitation = await this.workspaceRepository.findInvitationByToken(token);
        
        if (!invitation || invitation.isUsed || invitation.expiresAt < new Date()) {
            throw new InvalidOtpError();
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create workspace admin user
        const newWorkspaceAdmin: RegisterDTO = {
            username,
            email: invitation.email,
            password: hashedPassword,
            role: UserRoles.WORKSPACE_ADMIN,
        };
        
        await this.userRepository.createUser(newWorkspaceAdmin);
        
        // Mark invitation as used
        await this.workspaceRepository.updateInvitation(token, { isUsed: true });
    }
}