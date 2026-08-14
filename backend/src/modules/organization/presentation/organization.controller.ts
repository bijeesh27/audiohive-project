import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response";
import { IuseCase } from "../../../shared/interface/IuseCase";
import { IorganizationDocument } from "../infrastructure/organizationSchema";
import { createOrganizationDTO, updateOrganizationDTO } from "../application/dto/organizationDTO";
import { MESSAGES } from "../../../common/constant/messages";

export class OrganizationController {
    constructor(
        private readonly createOrganizationUseCase: IuseCase<createOrganizationDTO, IorganizationDocument>,
        private readonly updateOrganizationUseCase: IuseCase<updateOrganizationDTO, void>,
        private readonly deleteOrganizationUseCase: IuseCase<string, void>,
        private readonly getAllOrganizationUseCase: IuseCase<void, IorganizationDocument[]>,
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
            const organizationId = req.params.id
            await this.updateOrganizationUseCase.execute(organizationId, req.body)
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_UPDATED, null, 200)
        } catch (error) {
            next(error)
        }
    }

    async deleteOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const organizationId = req.params.id
            await this.deleteOrganizationUseCase.execute(organizationId)
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_DELETED, null, 200)
        } catch (error) {
            next(error)
        }
    }

    async getAllOrganizations(req: Request, res: Response, next: NextFunction) {
        try {
            const organizations = await this.getAllOrganizationUseCase.execute()
            return ApiResposne.success(res, MESSAGES.SUCCESS.GET_ALL_ORGANIZATIONS, organizations, 200)
        } catch (error) {
            next(error)
        }
    }
}