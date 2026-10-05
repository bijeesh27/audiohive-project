import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IworkspaceRepository } from "../../../workspace/domain/IworkspaceRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { InvitationError } from "../../../../common/Errors/WorkspaceError";

type InvitationType = "workspace-user" | "workspace" | "organization";

interface InvitationDetails {
    token: string;
    email?: string;
    role?: string;
    workspaceId?: string;
    organizationId?: string;
    type: InvitationType;
    ownerName?: string;
    ownerEmail?: string;
}

export class GetInvitationDetailsUseCase
    implements IuseCase<string, InvitationDetails>
{
    constructor(
        private readonly workspaceRepository: IworkspaceRepository,
        private readonly organizationRepository: IorganizaionRepository
    ) {}

    async execute(token: string): Promise<InvitationDetails> {
        const workspaceInvitation =
            await this.workspaceRepository.findInvitationByToken(token);

        if (workspaceInvitation) {
            const isUserInvite = Boolean(workspaceInvitation.role);

            return {
                token: workspaceInvitation.token,
                email: workspaceInvitation.email,
                role: workspaceInvitation.role,
                workspaceId: workspaceInvitation.workspaceId,
                type: isUserInvite ? "workspace-user" : "workspace",
            };
        }

        const organizationInvitation =
            await this.organizationRepository.findInvitationByToken(token);

        if (organizationInvitation) {
            return {
                token: organizationInvitation.token,
                type: "organization",
                ownerName: organizationInvitation.ownerName,
                ownerEmail: organizationInvitation.ownerEmail,
            };
        }

        throw new InvitationError();
    }
}