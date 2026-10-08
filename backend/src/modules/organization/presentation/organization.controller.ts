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
import { MESSAGES } from "../../../common/constant/messages";
import { AppError } from "../../../common/Errors/AppError";
import { HttpStatus } from "../../../common/constant/httpStatus";

export class OrganizationController {
    constructor(
        private readonly createOrganizationUseCase: IuseCase<CreateOrganizationDTO, void>,
        private readonly updateOrganizationUseCase: IuseCase<UpdateOrganizationDTO, void>,
        private readonly deleteOrganizationUseCase: IuseCase<DeleteOrganizationDTO, void>,
        private readonly getAllOrganizationUseCase: IuseCase<GetAllOrganizationsDTO, GetAllOrganizationsResultDTO>,
        private readonly getMyOrganizationUseCase: IuseCase<GetMyOrganizationDTO, IorganizationDocument>,
        private readonly getAllOrganizationUsersUseCase: IuseCase<GetOrganizationUsersDTO, GetOrganizationUsersResultDTO>,
        private readonly getOrgDashboardStatsUseCase: IuseCase<GetOrgDashboardStatsDTO, OrgDashboardStatsDTO>,
        private readonly sendOrganizationInvitationUseCase: IuseCase<SendOrganizationInvitationDTO, void>
    ) {}

    async createOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const organization = await this.createOrganizationUseCase.execute(req.body)
            return ApiResposne.success(res,MESSAGES.SUCCESS.ORGANIZATION_CREATED , organization, 201)
        } catch (error) {
            next(error)
        }
    }

    async sendInvitation(req: Request, res: Response, next: NextFunction) {
        try {
            const { ownerEmail, companyName, slug, ownerName, planId } = req.body;
            if (!ownerEmail || !companyName || !slug || !ownerName) {
                throw new AppError("ownerEmail, companyName, slug, and ownerName are required", HttpStatus.BAD_REQUEST);
            }
            await this.sendOrganizationInvitationUseCase.execute({ ownerEmail, companyName, slug, ownerName, planId });
            return ApiResposne.success(res, "Invitation sent successfully", null, 200);
        } catch (error) {
            next(error);
        }
    }

    async updateOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const organizationId = req.params.id as string;
            await this.updateOrganizationUseCase.execute({ organizationId, data: req.body });
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_UPDATED, null, 200)
        } catch (error) {
            next(error)
        }
    }

    async deleteOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const organizationId = req.params.id as string;
            await this.deleteOrganizationUseCase.execute({ organizationId })
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_DELETED, null, 200)
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
            return ApiResposne.success(res, MESSAGES.SUCCESS.GET_ALL_ORGANIZATIONS, data, 200)
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
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_FETCHED, data, 200);
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

            const data = await this.getAllOrganizationUsersUseCase.execute({ ownerEmail: userEmail, page, limit, search });
            return ApiResposne.success(res, MESSAGES.SUCCESS.USERS_FETCHED, data, 200);
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
            return ApiResposne.success(res, MESSAGES.SUCCESS.DASHBOARD_STATS_FETCHED, data, 200);
        } catch (error) {
            next(error);
        }
    }
}
