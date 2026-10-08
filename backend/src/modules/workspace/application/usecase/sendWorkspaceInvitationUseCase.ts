import { randomBytes } from "crypto";
import { HttpStatus } from "../../../../common/constant/httpStatus";
import { AppError } from "../../../../common/Errors/AppError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { emailQueue } from "../../../../config/queue.config";
import { OrganizationNotFound } from "../../../../common/Errors/OrganizationError";
import { WorkspaceNotFound } from "../../../../common/Errors/WorkspaceError";
import { IInvitationDocument } from "../../infrastructure/invitationSchema";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { SendWorkspaceInvitationDTO } from "../dto/workspaceDTOs";

export class SendWorkspaceInvitationUseCase implements IuseCase<SendWorkspaceInvitationDTO, void> {
    constructor(
        private readonly workspaceRepository: IworkspaceRepository,
        private readonly organizationRepository: IorganizaionRepository, private readonly activityLogRepository: IactivityLogRepository
    ) {}

    async execute(data: SendWorkspaceInvitationDTO): Promise<void> {
        const { workspaceId, email, workspaceAdminName, organizationOwnerEmail } = data;

        const organization = await this.organizationRepository.findByOwnerEmail(organizationOwnerEmail);
        if (!organization) {
            throw new OrganizationNotFound()
        }

        const workspace = await this.workspaceRepository.getWorkspaceById(workspaceId);
        if (!workspace) {
            throw new WorkspaceNotFound()
        }

        if (workspace.organizationId.toString() !== organization._id.toString()) {
            throw new AppError("You don't have permission to assign an admin for this workspace", HttpStatus.FORBIDDEN);
        }

        const token = randomBytes(32).toString('hex');
    
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await this.workspaceRepository.createInvitation({
            workspaceId,
            email,
            workspaceAdminName,
            token,
            isUsed: false,
            expiresAt,
        } as IInvitationDocument);

        await this.workspaceRepository.updateWorkspace(workspaceId, {
            workspaceAdminEmail: email,
        });

        const invitationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?token=${token}`;
        
        await emailQueue.add('send-workspace-invitation', {
            to: email,
            workspaceName: workspace.workspaceName,
            invitationLink,
        });

        await this.activityLogRepository.recordActivity({
              occurredAt: new Date(),
              action: "SEND_WORKSPACE_INVITATION",
              actorId: data ? (data as any).actorId || (data as any).userId || (data as any).uploaderId || null : null,
              organizationId: data ? (data as any).organizationId : undefined,
              workspaceId: data ? (data as any).workspaceId || (data as any).roomId : undefined,
              targetType: "SEND",
              targetId: undefined,
              metadata: {}
            });
    }
}
