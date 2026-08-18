import { randomBytes } from "crypto";
import { HttpStatus } from "../../../../common/constant/httpStatus.ts";
import { AppError } from "../../../../common/Errors/AppError.ts";
import { IuseCase } from "../../../../shared/interface/IuseCase.ts";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository.ts";
import { emailQueue } from "../../../../config/queue.config.ts";

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

        // Verify the workspace and permissions
        const workspace = await this.workspaceRepository.getWorkspaceById(workspaceId);
        if (!workspace) {
            throw new AppError("Workspace not found", HttpStatus.NOT_FOUND);
        }

        if (workspace.workspaceAdminEmail !== workspaceAdminEmail) {
            throw new AppError("You don't have permission to invite users to this workspace", HttpStatus.FORBIDDEN);
        }

        // Generate invitation token
        const token = randomBytes(32).toString('hex');
        
        // 24 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Save Invitation Document
        await this.workspaceRepository.createInvitation({
            workspaceId,
            email,
            invitedName,
            role,
            token,
            isUsed: false,
            expiresAt,
        } as any);

        // Add to email queue
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
