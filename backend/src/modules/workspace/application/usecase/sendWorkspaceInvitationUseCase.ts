import { randomBytes } from "crypto";
import { HttpStatus } from "../../../../common/constant/httpStatus";
import { AppError } from "../../../../common/Errors/AppError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { emailQueue } from "../../../../config/queue.config";

export interface SendWorkspaceInvitationDTO {
    workspaceId: string;
    email: string;
    workspaceAdminName: string;
    organizationOwnerEmail: string; // Used to fetch organization and verify ownership
}

export class SendWorkspaceInvitationUseCase implements IuseCase<SendWorkspaceInvitationDTO, void> {
    constructor(
        private readonly workspaceRepository: IworkspaceRepository,
        private readonly organizationRepository: IorganizaionRepository,
    ) {}

    async execute(data: SendWorkspaceInvitationDTO): Promise<void> {
        const { workspaceId, email, workspaceAdminName, organizationOwnerEmail } = data;

        // Verify the organization
        const organization = await this.organizationRepository.findByOwnerEmail(organizationOwnerEmail);
        if (!organization) {
            throw new AppError("No organization found for this user", HttpStatus.NOT_FOUND);
        }

        // Verify the workspace
        const workspace = await this.workspaceRepository.getWorkspaceById(workspaceId);
        if (!workspace) {
            throw new AppError("Workspace not found", HttpStatus.NOT_FOUND);
        }

        if (workspace.organizationId.toString() !== organization._id.toString()) {
            throw new AppError("You don't have permission to assign an admin for this workspace", HttpStatus.FORBIDDEN);
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
            workspaceAdminName,
            token,
            isUsed: false,
            expiresAt,
        } as any);

        // Update the workspace with the admin email
        await this.workspaceRepository.updateWorkspace(workspaceId, {
            workspaceAdminEmail: email,
        });

        // Add to email queue
        const invitationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?token=${token}`;
        
        await emailQueue.add('send-workspace-invitation', {
            to: email,
            workspaceName: workspace.workspaceName,
            invitationLink,
        });
    }
}
