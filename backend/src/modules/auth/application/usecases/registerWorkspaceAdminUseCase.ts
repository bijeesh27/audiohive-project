import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserRepository } from "../../domain/IuserRepository";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository";
import { InvalidOtpError } from "../../../../common/Errors/AuthError";
import { UserRoles } from "../../../../common/constant/userRoles";
import bcrypt from "bcrypt";

interface RegisterWorkspaceAdminInput {
    token: string;
    username: string;
    password: string;
}

interface CreateWorkspaceAdminData {
    username: string;
    email: string;
    password: string;
    role: UserRoles.WORKSPACE_ADMIN;
    workspaceId: string;
}

export class RegisterWorkspaceAdminUseCase
    implements IuseCase<RegisterWorkspaceAdminInput, void>
{
    constructor(
        private readonly userRepository: IuserRepository,
        private readonly workspaceRepository: IworkspaceRepository
    ) {}

    async execute(data: RegisterWorkspaceAdminInput): Promise<void> {
        const { token, username, password } = data;

        const invitation =
            await this.workspaceRepository.findInvitationByToken(token);

        if (
            !invitation ||
            invitation.isUsed ||
            invitation.expiresAt < new Date()
        ) {
            throw new InvalidOtpError();
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newWorkspaceAdmin: CreateWorkspaceAdminData = {
            username,
            email: invitation.email,
            password: hashedPassword,
            role: UserRoles.WORKSPACE_ADMIN,
            workspaceId: invitation.workspaceId,
        };

        await this.userRepository.createUser(newWorkspaceAdmin);

        await this.workspaceRepository.updateInvitation(token, {
            isUsed: true,
        });
    }
}