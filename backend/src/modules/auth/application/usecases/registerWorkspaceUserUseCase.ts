import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository.ts";
import { RegisterDTO } from "../dtos/AuthDTO.ts";
import { InvalidOtpError } from "../../../../common/Errors/AuthError.ts";
import bcrypt from "bcrypt";

interface RegisterWorkspaceUserInput {
    token: string;
    username: string;
    password: string;
}

interface RegisterWorkspaceUserData extends RegisterDTO {
    workspaceId: string;
}

export class RegisterWorkspaceUserUseCase
    implements IuseCase<RegisterWorkspaceUserInput, void>
{
    constructor(
        private readonly userRepository: IuserRepository,
        private readonly workspaceRepository: IworkspaceRepository
    ) {}

    async execute(data: RegisterWorkspaceUserInput): Promise<void> {
        const { token, username, password } = data;

        const invitation =
            await this.workspaceRepository.findInvitationByToken(token);

        if (
            !invitation ||
            invitation.isUsed ||
            invitation.expiresAt < new Date() ||
            !invitation.role
        ) {
            throw new InvalidOtpError();
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser: RegisterWorkspaceUserData = {
            username,
            email: invitation.email,
            password: hashedPassword,
            role: invitation.role,
            workspaceId: invitation.workspaceId,
        };

        await this.userRepository.createUser(newUser);

        await this.workspaceRepository.updateInvitation(token, {
            isUsed: true,
        });
    }
}