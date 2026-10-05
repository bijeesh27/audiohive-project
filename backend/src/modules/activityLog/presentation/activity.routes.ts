import express from 'express'
import { ActivityLogRepository } from '../infrastructure/activitylogRepository'
import { RecordActivityLogUseCase } from '../application/usecases/RecordAcivityUseCase'
import { ActivityLogController } from './activitylog.controller'
const router=express.Router()


const activityLogRepository=new ActivityLogRepository

const recordActivityLogUseCase=new RecordActivityLogUseCase(activityLogRepository)

const controller=new ActivityLogController(recordActivityLogUseCase)

router.post('/record',controller.recordActivityLog.bind(controller))

export default router