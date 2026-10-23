import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IuserRepository } from "../../domain/IuserRepository.ts";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository.ts";
import { RegisterDTO } from "../dtos/AuthDTO.ts";
import { InvalidOtpError } from "../../../../common/Errors/AuthError.ts";
import { UserRoles } from "../../../../common/constant/userRoles.ts";
import { getUserWorkspaceIds } from "../../../../shared/User.utils/workspaceMembership.ts";
import bcrypt from "bcrypt";

interface RegisterWorkspaceUserInput {
    token: string;
    username: string;
    password: string;
}

interface RegisterWorkspaceUserData extends RegisterDTO {
    workspaceIds: string[];
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
            invitation.role !== UserRoles.MEMBER
        ) {
            throw new InvalidOtpError();
        }

        const existingUser = await this.userRepository.findByEmail(invitation.email);
        if (existingUser) {
            if (existingUser.role !== UserRoles.MEMBER || !existingUser.status) {
                throw new InvalidOtpError("This invitation cannot be applied to this account");
            }

            const workspaceIds = getUserWorkspaceIds(existingUser);
            if (!workspaceIds.includes(invitation.workspaceId)) {
                workspaceIds.push(invitation.workspaceId);
                const updated = await this.userRepository.setWorkspaceIds(
                    existingUser._id,
                    workspaceIds,
                );
                if (!updated) throw new InvalidOtpError();
            }

            await this.workspaceRepository.updateInvitation(token, { isUsed: true });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser: RegisterWorkspaceUserData = {
            username,
            email: invitation.email,
            password: hashedPassword,
            role: invitation.role,
            workspaceIds: [invitation.workspaceId],
        };

        await this.userRepository.createUser(newUser);

        await this.workspaceRepository.updateInvitation(token, {
            isUsed: true,
        });
    }
}
