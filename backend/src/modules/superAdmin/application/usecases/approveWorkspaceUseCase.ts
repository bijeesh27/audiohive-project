import crypto from 'crypto';
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository";
import { emailQueue } from "../../../../config/queue.config";
import { API_ROUTES } from '../../../../common/constant/ApiRoutes';
import { IInvitationDocument } from '../../../workspace/infrastructure/invitationSchema';
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { ApproveWorkspaceDTO } from "../dtos/SuperAdminDTO.ts";

export class ApproveWorkspaceUseCase implements IuseCase<ApproveWorkspaceDTO, void> {
    
    constructor(private readonly workspaceRepository: IworkspaceRepository, private readonly activityLogRepository: IactivityLogRepository) {}

    async execute(data: ApproveWorkspaceDTO): Promise<void> {
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
        await this.workspaceRepository.createInvitation(workspaceInvitation as unknown as IInvitationDocument)
        const invitationLink = `${process.env.CLIENT_URL}${API_ROUTES.AUTH.REGISTER}?token=${token}`;
        
        await emailQueue.add('send-workspace-invitation', {
            to: data.adminEmail,
            workspaceName: data.workspaceName,
            invitationLink
        });

        await this.activityLogRepository.recordActivity({
              occurredAt: new Date(),
              action: "APPROVE_WORKSPACE",
              actorId: data ? (data as any).actorId || (data as any).userId || (data as any).uploaderId || null : null,
              organizationId: data ? (data as any).organizationId : undefined,
              workspaceId: data ? (data as any).workspaceId || (data as any).roomId : undefined,
              targetType: "APPROVE",
              targetId: undefined,
              metadata: {}
            });
    }
}
