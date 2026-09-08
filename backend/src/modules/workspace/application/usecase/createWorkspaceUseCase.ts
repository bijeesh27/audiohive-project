import { HttpStatus } from "../../../../common/constant/httpStatus";
import { MESSAGES } from "../../../../common/constant/messages";
import { AppError } from "../../../../common/Errors/AppError";
import { CreateWorkspaceError } from "../../../../common/Errors/WorkspaceError";
import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { IworkspaceRepository } from "../../domain/IworkspaceRepository";
import { IWorkspaceDocument } from "../../infrastructure/workspaceSchema";
import { createWorkspaceDTO } from "../dto/workspaceDTOs";

import { IsubscriptionRepository } from "../../../subscription/domain/IsubscriptionRepository";
import { OrganizationNotFound } from "../../../../common/Errors/OrganizationError";

export class CreateWorkspaceUseCase implements IuseCase<createWorkspaceDTO, void> {
    constructor(
        private readonly workspaceRepository: IworkspaceRepository,
        private readonly organizationRepository: IorganizaionRepository,
        private readonly subscriptionRepository: IsubscriptionRepository,
    ) {}

    async execute(data?: createWorkspaceDTO): Promise<void> {
        if (!data) {
            throw new CreateWorkspaceError(MESSAGES.ERRORS.WORKSPACE_INVALID_DATA);
        }

        const organization = await this.organizationRepository.findByOwnerEmail(data.userEmail);
        if (!organization) {
            throw new OrganizationNotFound()
        }

        let subscription = await this.subscriptionRepository.findSubscription(organization.planId);
        const isHexId = typeof organization.planId === 'string' && /^[0-9a-fA-F]{24}$/.test(organization.planId);
        if (!subscription && isHexId) {
            subscription = await this.subscriptionRepository.findSubscriptionById(organization.planId);
        }
        let maxWorkspaces = 2;
        if (subscription) {
            maxWorkspaces = subscription.maxWorkspaces;
        } else if (!organization.planId || organization.planId.toString().trim().toLowerCase() !== 'free') {
            throw new AppError(`Subscription plan not found for planId: '${organization.planId}'`, HttpStatus.NOT_FOUND);
        }

        const { total: currentWorkspacesCount } = await this.workspaceRepository.getWorkspacesByOrg(organization._id.toString(), 1, 1);
        if (currentWorkspacesCount >= maxWorkspaces) {
            throw new AppError("Maximum workspace limit reached for your subscription plan", HttpStatus.BAD_REQUEST);
        }

        try {
            await this.workspaceRepository.createWorkspace({
                organizationId: organization._id,
                workspaceName: data.workspaceName,
                slug: data.slug,
            } as unknown as IWorkspaceDocument);
        } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
                throw new CreateWorkspaceError("Workspace slug is already in use");
            }
            throw error;
        }
    }
}