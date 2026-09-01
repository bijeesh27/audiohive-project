import { randomBytes } from "crypto";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository.ts";
import { emailQueue } from "../../../../config/queue.config.ts";
import { WorkspaceNotFound } from "../../../../common/Errors/WorkspaceError.ts";
import { InvalidOtpError } from "../../../../common/Errors/AuthError.ts";
import { IInvitationDocument } from "../../../workspace/infrastructure/invitationSchema.ts";

export interface SendUserInvitationDTO {
    workspaceId: string;
    email: string;
    invitedName: string;
    role: string;
    workspaceAdminEmail: string;
}

export class SendUserInvitationUseCase implements IuseCase<SendUserInvitationDTO, void> {
    constructor(
        private readonly workspaceRepository: IworkspaceRepository,
    ) {}

    async execute(data: SendUserInvitationDTO): Promise<void> {
        const { workspaceId, email, invitedName, role, workspaceAdminEmail } = data;

        const workspace = await this.workspaceRepository.getWorkspaceById(workspaceId);
        if (!workspace) {
            throw new WorkspaceNotFound()
        }

        if (workspace.workspaceAdminEmail !== workspaceAdminEmail) {
            throw new InvalidOtpError("You don't have permission to invite users to this workspace")
        }

        const token = randomBytes(32).toString('hex');
   
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await this.workspaceRepository.createInvitation({
            workspaceId,
            email,
            invitedName,
            role,
            token,
            isUsed: false,
            expiresAt,
        } as IInvitationDocument);

        const invitationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?token=${token}`;
        
        await emailQueue.add('send-user-invitation', {
            to: email,
            workspaceName: workspace.workspaceName,
            invitedName,
            role,
            invitationLink,
        });
    }
}
