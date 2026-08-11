import crypto from 'crypto';
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository";
import { emailQueue } from "../../../../config/queue.config";

export class ApproveWorkspaceUseCase implements IuseCase<{ workspaceId: string, adminEmail: string, workspaceName: string }, void> {
    
    constructor(private readonly workspaceRepository: IworkspaceRepository) {}

    async execute(data: { workspaceId: string, adminEmail: string, workspaceName: string }): Promise<void> {
        await this.workspaceRepository.updateWorkspace(data.workspaceId, { status: 'active' } as const);
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const workspaceInvitation={
            workspaceId: data.workspaceId,
            email: data.adminEmail,
            token,
            expiresAt,
            isUsed: false
        }
        await this.workspaceRepository.createInvitation(workspaceInvitation)
        const invitationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?token=${token}`;
        
        await emailQueue.add('send-workspace-invitation', {
            to: data.adminEmail,
            workspaceName: data.workspaceName,
            invitationLink
        });
    }
}