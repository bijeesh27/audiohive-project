import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { InvitationError } from "../../../../common/Errors/WorkspaceError";

export class GetInvitationDetailsUseCase implements IuseCase<string, any> {
    constructor(
        private readonly workspaceRepository: IworkspaceRepository,
        private readonly organizationRepository: IorganizaionRepository
    ) {}

    async execute(token: string): Promise<any> {
        // Check workspace invitations first
        const workspaceInvitation = await this.workspaceRepository.findInvitationByToken(token);
        if (workspaceInvitation) {
            const isUserInvite = !!workspaceInvitation.role;
            return {
                ...workspaceInvitation.toObject ? workspaceInvitation.toObject() : workspaceInvitation,
                type: isUserInvite ? 'workspace-user' : 'workspace'
            };
        }

        // Then check organization invitations
        const orgInvitation = await this.organizationRepository.findInvitationByToken(token);
        if (orgInvitation) {
            return {
                ...((orgInvitation as any).toObject ? (orgInvitation as any).toObject() : orgInvitation),
                type: 'organization'
            };
        }

        // If neither found, throw error
        throw new InvitationError();
    }
}
