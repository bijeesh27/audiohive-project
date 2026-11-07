import { NextFunction, Request, Response } from "express";
import { IuseCase } from "../../../shared/interface/IuseCase";
import { ApiResposne } from "../../../common/Response/Response";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { ActivityLogInputDTO } from "../application/dto/activityLogDTO";
import { ActivityLogQueryOptions, PaginatedActivityLogs } from "../domain/IactivitylogRepository";
import { MESSAGES } from "../../../common/constant/messages";

export class ActivityLogController {
    constructor(
        private readonly recordActivityLogUseCase: IuseCase<ActivityLogInputDTO, void>,
        private readonly getWorkspaceActivityLogsUseCase: IuseCase<{ workspaceId: string } & ActivityLogQueryOptions, PaginatedActivityLogs>,
        private readonly getOrganizationActivityLogsUseCase: IuseCase<{ organizationId: string } & ActivityLogQueryOptions, PaginatedActivityLogs>,
        private readonly getSystemActivityLogsUseCase: IuseCase<ActivityLogQueryOptions, PaginatedActivityLogs>
    ) {}

    async recordActivityLog(req: Request, res: Response, next: NextFunction) {
        try {
            const activityLog = await this.recordActivityLogUseCase.execute(req.body);
            return ApiResposne.success(res, MESSAGES.SUCCESS.ACTIVITY_LOG_RECORDED, activityLog);
        } catch (error) {
            next(error);
        }
    }

    async getWorkspaceActivityLogs(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const workspaceId = req.user?.workspaceId as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = (req.query.search as string) || undefined;
            const result = await this.getWorkspaceActivityLogsUseCase.execute({ workspaceId, page, limit, search });
            return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_ACTIVITY_LOGS_RETRIEVED, result);
        } catch (error) {
            next(error);
        }
    }

    async getOrganizationActivityLogs(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const organizationId = req.params.organizationId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = (req.query.search as string) || undefined;
            const result = await this.getOrganizationActivityLogsUseCase.execute({ organizationId, page, limit, search });
            return ApiResposne.success(res, MESSAGES.SUCCESS.ORGANIZATION_ACTIVITY_LOGS_RETRIEVED, result);
        } catch (error) {
            next(error);
        }
    }

    async getSystemActivityLogs(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = (req.query.search as string) || undefined;
            const result = await this.getSystemActivityLogsUseCase.execute({ page, limit, search });
            return ApiResposne.success(res, MESSAGES.SUCCESS.SYSTEM_ACTIVITY_LOGS_RETRIEVED, result);
        } catch (error) {
            next(error);
        }
    }
}
