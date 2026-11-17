import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response";
import { IuseCase } from "../../../shared/interface/IuseCase";
import { IorganizationDocument } from "../infrastructure/organizationSchema";
import {
    CreateOrganizationDTO,
    DeleteOrganizationDTO,
    GetAllOrganizationsDTO,
    GetAllOrganizationsResultDTO,
    GetMyOrganizationDTO,
    GetOrganizationUsersDTO,
    GetOrganizationUsersResultDTO,
    GetOrgDashboardStatsDTO,
    OrgDashboardStatsDTO,
    SendOrganizationInvitationDTO,
    UpdateOrganizationDTO,
} from "../application/dto/organizationDTO";
import {
    GetOrganizationAnalyticsInputDTO,
    OrganizationAnalyticsResponseDTO,
} from "../application/dto/organizationAnalyticsDTO";
import {
    GetOwnerDashboardInputDTO,
    OwnerDashboardResponseDTO,
} from "../application/dto/ownerDashboardDTO";
import { MESSAGES } from "../../../common/constant/messages";
import { AppError } from "../../../common/Errors/AppError";
import { HttpStatus } from "../../../common/constant/httpStatus";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { SetUserWorkspacesDTO, UpdateOrgUserStatusDTO, UpdateOrgUserRoleDTO, RemoveOrgUserDTO } from "../application/dto/organizationDTO";
import { IuserDTO } from "../../../shared/User.utils/userDTO";

export class OrganizationController {
    constructor(
        private readonly createOrganizationUseCase: IuseCase<CreateOrganizationDTO, void>,
        private readonly updateOrganizationUseCase: IuseCase<UpdateOrganizationDTO, void>,
        private readonly deleteOrganizationUseCase: IuseCase<DeleteOrganizationDTO, void>,
        private readonly getAllOrganizationUseCase: IuseCase<GetAllOrganizationsDTO, GetAllOrganizationsResultDTO>,
        private readonly getMyOrganizationUseCase: IuseCase<GetMyOrganizationDTO, IorganizationDocument>,
        private readonly getAllOrganizationUsersUseCase: IuseCase<GetOrganizationUsersDTO, GetOrganizationUsersResultDTO>,
        private readonly getOrgDashboardStatsUseCase: IuseCase<GetOrgDashboardStatsDTO, OrgDashboardStatsDTO>,
        private readonly sendOrganizationInvitationUseCase: IuseCase<SendOrganizationInvitationDTO, void>,
        private readonly setUserWorkspacesUseCase: IuseCase<SetUserWorkspacesDTO, IuserDTO>,
        private readonly getOrganizationAnalyticsUseCase?: IuseCase<GetOrganizationAnalyticsInputDTO, OrganizationAnalyticsResponseDTO>,
        private readonly getOwnerDashboardUseCase?: IuseCase<GetOwnerDashboardInputDTO, OwnerDashboardResponseDTO>,
        private readonly updateOrgUserStatusUseCase?: IuseCase<UpdateOrgUserStatusDTO, { success: boolean; status: boolean }>,
        private readonly updateOrgUserRoleUseCase?: IuseCase<UpdateOrgUserRoleDTO, { success: boolean; role: string }>,
        private readonly removeOrgUserUseCase?: IuseCase<RemoveOrgUserDTO, { success: boolean; message: string }>
    ) {}

    async createOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const organization = await this.createOrganizationUseCase.execute(req.body)
            return ApiResposne.success(res,MESSAGES.SUCCESS.ORGANIZATION_CREATED , organization, HttpStatus.CREATED)
        } catch (error) {
            next(error)
        }
    }

    async sendInvitation(req: Request, res: Response, next: NextFunction) {
        try {
            const { ownerEmail, companyName, slug, ownerName, planId } = req.body;
            if (!ownerEmail || !companyName || !slug || !ownerName) {
                throw new AppError(MESSAGES.ERRORS.REQUIRED_ORG_FIELDS, HttpStatus.BAD_REQUEST);
            }
            await this.sendOrganizationInvitationUseCase.execute({ ownerEmail, companyName, slug, ownerName, planId });
            return ApiResposne.success(res, MESSAGES.SUCCESS.INVITATION_SEND, null, HttpStatus.OK);
        } catch (error) {
            next(error);
        }
    }

    async updateOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const organizationId = req.params.id as string;
            await this.updateOrganizationUseCase.execute({ organizationId, data: req.body });
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_UPDATED, null, HttpStatus.OK)
        } catch (error) {
            next(error)
        }
    }

    async deleteOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const organizationId = req.params.id as string;
            await this.deleteOrganizationUseCase.execute({ organizationId })
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_DELETED, null, HttpStatus.OK)
        } catch (error) {
            next(error)
        }
    }

    async getAllOrganizations(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const sort = req.query.sort as string|undefined;
            const search = req.query.search as string|undefined;

            const data = await this.getAllOrganizationUseCase.execute({ page, limit, search, sort })
            return ApiResposne.success(res, MESSAGES.SUCCESS.GET_ALL_ORGANIZATIONS, data, HttpStatus.OK)
        } catch (error) {
            next(error)
        }
    }

    async getMyOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const userEmail = req.user?.userEmail;
            if (!userEmail) {
                throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }
            const data = await this.getMyOrganizationUseCase.execute({ ownerEmail: userEmail });
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_FETCHED, data, HttpStatus.OK);
        } catch (error) {
            next(error);
        }
    }

    async getOrganizationUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const userEmail = req.user?.userEmail;
            if (!userEmail) {
                throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string | undefined;
            const workspaceId = req.query.workspaceId as string | undefined;
            const role = req.query.role as string | undefined;
            const status = req.query.status as string | undefined;
            const presence = req.query.presence as string | undefined;
            const sortField = (req.query.sortField || req.query.sort) as string | undefined;
            const sortOrder = (req.query.sortOrder || req.query.order) as "asc" | "desc" | undefined;

            const data = await this.getAllOrganizationUsersUseCase.execute({
                ownerEmail: userEmail,
                page,
                limit,
                search,
                workspaceId,
                role,
                status,
                presence,
                sortField,
                sortOrder,
            });
            return ApiResposne.success(res, MESSAGES.SUCCESS.USERS_FETCHED, data, HttpStatus.OK);
        } catch (error) {
            next(error);
        }
    }

    async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const ownerEmail = req.user?.userEmail;
            const actorId = req.user?.id;
            if (!ownerEmail || !actorId) {
                throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }
            if (!this.updateOrgUserStatusUseCase) {
                throw new AppError("Service not available", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const result = await this.updateOrgUserStatusUseCase.execute({
                ownerEmail,
                actorId,
                userId: req.params.userId as string,
                status: req.body.status,
            });
            return ApiResposne.success(res, "User status updated successfully", result, HttpStatus.OK);
        } catch (error) {
            next(error);
        }
    }

    async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const ownerEmail = req.user?.userEmail;
            const actorId = req.user?.id;
            if (!ownerEmail || !actorId) {
                throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }
            if (!this.updateOrgUserRoleUseCase) {
                throw new AppError("Service not available", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const result = await this.updateOrgUserRoleUseCase.execute({
                ownerEmail,
                actorId,
                userId: req.params.userId as string,
                role: req.body.role,
            });
            return ApiResposne.success(res, "User role updated successfully", result, HttpStatus.OK);
        } catch (error) {
            next(error);
        }
    }

    async removeUser(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const ownerEmail = req.user?.userEmail;
            const actorId = req.user?.id;
            if (!ownerEmail || !actorId) {
                throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }
            if (!this.removeOrgUserUseCase) {
                throw new AppError("Service not available", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const result = await this.removeOrgUserUseCase.execute({
                ownerEmail,
                actorId,
                userId: req.params.userId as string,
            });
            return ApiResposne.success(res, "User removed from organization successfully", result, HttpStatus.OK);
        } catch (error) {
            next(error);
        }
    }

    async setUserWorkspaces(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const ownerEmail = req.user?.userEmail;
            const actorId = req.user?.id;
            if (!ownerEmail || !actorId) {
                throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const updated = await this.setUserWorkspacesUseCase.execute({
                ownerEmail,
                actorId,
                userId: req.params.userId as string,
                workspaceIds: req.body.workspaceIds,
            });
            return ApiResposne.success(res, MESSAGES.SUCCESS.USER_UPDATED, updated);
        } catch (error) {
            next(error);
        }
    }

    async getOrgDashboardStats(req: Request, res: Response, next: NextFunction) {
        try {
            const userEmail = req.user?.userEmail;
            if (!userEmail) {
                throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }
            const data = await this.getOrgDashboardStatsUseCase.execute({ ownerEmail: userEmail });
            return ApiResposne.success(res, MESSAGES.SUCCESS.DASHBOARD_STATS_FETCHED, data, HttpStatus.OK);
        } catch (error) {
            next(error);
        }
    }

    async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const ownerEmail = req.user?.userEmail;
            if (!ownerEmail || !this.getOrganizationAnalyticsUseCase) {
                throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }
            const range = req.query.range as "today" | "7d" | "30d" | "custom" | undefined;
            const startDate = req.query.startDate as string | undefined;
            const endDate = req.query.endDate as string | undefined;

            const data = await this.getOrganizationAnalyticsUseCase.execute({
                ownerEmail,
                range,
                startDate,
                endDate,
            });
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_ANALYTICS_RETRIEVED, data, HttpStatus.OK);
        } catch (error) {
            next(error);
        }
    }

    async getOwnerDashboard(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const ownerEmail = req.user?.userEmail;
            if (!ownerEmail || !this.getOwnerDashboardUseCase) {
                throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }
            const range = req.query.range as "today" | "7d" | "30d" | "custom" | undefined;
            const startDate = req.query.startDate as string | undefined;
            const endDate = req.query.endDate as string | undefined;

            const data = await this.getOwnerDashboardUseCase.execute({
                ownerEmail,
                range,
                startDate,
                endDate,
            });
            return ApiResposne.success(res, "Owner dashboard fetched successfully", data, HttpStatus.OK);
        } catch (error) {
            next(error);
        }
    }
}
