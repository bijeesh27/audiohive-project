import crypto from 'crypto';
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository";
import { emailQueue } from "../../../../config/queue.config";
import { API_ROUTES } from '../../../../common/constant/ApiRoutes';

export class ApproveWorkspaceUseCase implements IuseCase<{ workspaceId: string, adminEmail: string, workspaceName: string ,workspaceAdminName: string}, void> {
    
    constructor(private readonly workspaceRepository: IworkspaceRepository) {}

    async execute(data: { workspaceId: string,workspaceAdminName:string, adminEmail: string, workspaceName: string }): Promise<void> {
        await this.workspaceRepository.updateWorkspace(data.workspaceId, { status: 'active' } as const);
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const workspaceInvitation={
            workspaceId: data.workspaceId,
            workspaceAdminName:data.workspaceAdminName,
            email: data.adminEmail,
            token,
            expiresAt,
            isUsed: false
        }
        await this.workspaceRepository.createInvitation(workspaceInvitation)
        const invitationLink = `${process.env.CLIENT_URL}${API_ROUTES.AUTH.REGISTER}?token=${token}`;
        
        await emailQueue.add('send-workspace-invitation', {
            to: data.adminEmail,
            workspaceName: data.workspaceName,
            invitationLink
        });
    }
}