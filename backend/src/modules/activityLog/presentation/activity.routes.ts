import express from 'express'
import { ActivityLogRepository } from '../infrastructure/activitylogRepository'
import { RecordActivityLogUseCase } from '../application/usecases/RecordAcivityUseCase'
import { ActivityLogController } from './activitylog.controller'
import { API_ROUTES } from '../../../common/constant/ApiRoutes'
const router=express.Router()


const activityLogRepository=new ActivityLogRepository

const recordActivityLogUseCase=new RecordActivityLogUseCase(activityLogRepository)

const controller=new ActivityLogController(recordActivityLogUseCase)

router.post(API_ROUTES.ACTIVITY.RECORD_ACTIVITY,controller.recordActivityLog.bind(controller))

export default router