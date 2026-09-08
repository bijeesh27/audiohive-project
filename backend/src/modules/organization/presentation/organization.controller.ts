import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response";
import { IuseCase } from "../../../shared/interface/IuseCase";
import { IorganizationDocument } from "../infrastructure/organizationSchema";
import { createOrganizationDTO, updateOrganizationDTO } from "../application/dto/organizationDTO";
import { MESSAGES } from "../../../common/constant/messages";
import { IuserDocument } from "../../../shared/User.utils/userSchema";

export class OrganizationController {
    constructor(
        private readonly createOrganizationUseCase: IuseCase<createOrganizationDTO, void>,
        private readonly updateOrganizationUseCase: IuseCase<{ organizationId: string; data: Partial<IorganizationDocument> }, void>,
        private readonly deleteOrganizationUseCase: IuseCase<string, void>,
        private readonly getAllOrganizationUseCase: IuseCase<{ page: number; limit: number; search?: string; sort?: string }, { organizations: IorganizationDocument[]; total: number }>,
        private readonly getMyOrganizationUseCase: IuseCase<string, IorganizationDocument>,
        private readonly getAllOrganizationUsersUseCase: IuseCase<{ ownerEmail: string; page: number; limit: number; search?: string }, { users: IuserDocument[]; total: number }>,
        private readonly getOrgDashboardStatsUseCase: IuseCase<string, { totalWorkspaces: number; totalUsers: number }>
    ) {}

    async createOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const organization = await this.createOrganizationUseCase.execute(req.body)
            return ApiResposne.success(res,MESSAGES.SUCCESS.ORGANIZATION_CREATED , organization, 201)
        } catch (error) {
            next(error)
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
            await this.deleteOrganizationUseCase.execute(organizationId)
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
                return res.status(401).json({ success: false, message: MESSAGES.ERRORS.UNAUTHORIZED });
            }
            const data = await this.getMyOrganizationUseCase.execute(userEmail);
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_FETCHED, data, 200);
        } catch (error) {
            next(error);
        }
    }

    async getOrganizationUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const userEmail = req.user?.userEmail;
            if (!userEmail) {
                return res.status(401).json({ success: false, message: MESSAGES.ERRORS.UNAUTHORIZED });
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
                return res.status(401).json({ success: false, message: MESSAGES.ERRORS.UNAUTHORIZED });
            }
            const data = await this.getOrgDashboardStatsUseCase.execute(userEmail);
            return ApiResposne.success(res, MESSAGES.SUCCESS.DASHBOARD_STATS_FETCHED, data, 200);
        } catch (error) {
            next(error);
        }
    }
}