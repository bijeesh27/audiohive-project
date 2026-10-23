import express from 'express'
import { ActivityLogRepository } from '../infrastructure/activitylogRepository'
import { RecordActivityLogUseCase } from '../application/usecases/RecordAcivityUseCase'
import { GetWorkspaceActivityLogsUseCase } from '../application/usecases/GetWorkspaceActivityLogsUseCase'
import { GetOrganizationActivityLogsUseCase } from '../application/usecases/GetOrganizationActivityLogsUseCase'
import { GetSystemActivityLogsUseCase } from '../application/usecases/GetSystemActivityLogsUseCase'
import { ActivityLogController } from './activitylog.controller'
import { API_ROUTES } from '../../../common/constant/ApiRoutes'
import { authMiddleware, roleMiddleware } from '../../../middleware/authMiddleware'
import { UserRoles } from '../../../common/constant/userRoles'

const router = express.Router()

const activityLogRepository = new ActivityLogRepository()

const recordActivityLogUseCase = new RecordActivityLogUseCase(activityLogRepository)
const getWorkspaceActivityLogsUseCase = new GetWorkspaceActivityLogsUseCase(activityLogRepository)
const getOrganizationActivityLogsUseCase = new GetOrganizationActivityLogsUseCase(activityLogRepository)
const getSystemActivityLogsUseCase = new GetSystemActivityLogsUseCase(activityLogRepository)

const controller = new ActivityLogController(
    recordActivityLogUseCase,
    getWorkspaceActivityLogsUseCase,
    getOrganizationActivityLogsUseCase,
    getSystemActivityLogsUseCase
)

router.post(API_ROUTES.ACTIVITY.RECORD_ACTIVITY, controller.recordActivityLog.bind(controller))

// Workspace Admin: logs scoped to their workspace (workspaceId from JWT)
router.get(
    API_ROUTES.ACTIVITY.GET_WORKSPACE_LOGS,
    authMiddleware,
    roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
    controller.getWorkspaceActivityLogs.bind(controller)
)

// Organization Admin: logs scoped to a specific organization
router.get(
    API_ROUTES.ACTIVITY.GET_ORGANIZATION_LOGS,
    authMiddleware,
    roleMiddleware([UserRoles.ORGANIZATION_OWNER]),
    controller.getOrganizationActivityLogs.bind(controller)
)

// Super Admin: system-wide logs
router.get(
    API_ROUTES.ACTIVITY.GET_SYSTEM_LOGS,
    authMiddleware,
    roleMiddleware([UserRoles.SUPER_ADMIN]),
    controller.getSystemActivityLogs.bind(controller)
)

export default router
