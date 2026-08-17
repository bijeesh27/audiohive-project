

import express from 'express'
import { OrganizationController } from './organization.controller'
import { OrganizationRepository } from '../infrastructure/organizationRepository'
import { CreateOrganizationUseCase } from '../application/usecases/createOrganizationUseCase'
import { UpdateOrganizationUseCase } from '../application/usecases/updateOrganizationUseCase'
import { DeleteOrganizationUseCase } from '../application/usecases/deleteOrganizationUseCase'
import { GetAllOrganizationUseCase } from '../application/usecases/getAllOrganizationUseCase'
import { GetMyOrganizationUseCase } from '../application/usecases/getMyOrganizationUseCase'
import { API_ROUTES } from '../../../common/constant/ApiRoutes'
import { authMiddleware, roleMiddleware } from '../../../middleware/authMiddleware'

const router=express.Router()


const organizationRepository=new OrganizationRepository()
const createOrganizationUseCase=new CreateOrganizationUseCase(organizationRepository)
const updateOrganizationUseCase=new UpdateOrganizationUseCase(organizationRepository)
const deleteOrganizationUseCase=new DeleteOrganizationUseCase(organizationRepository)
const getAllOrganizationUseCase=new GetAllOrganizationUseCase(organizationRepository)
const getMyOrganizationUseCase=new GetMyOrganizationUseCase(organizationRepository)



const controller=new OrganizationController(
createOrganizationUseCase,
updateOrganizationUseCase,
deleteOrganizationUseCase,
getAllOrganizationUseCase,
getMyOrganizationUseCase
)





router.post(API_ROUTES.ORGANIZATION.CREATE_ORGANIZATION,controller.createOrganization.bind(controller))
router.post(API_ROUTES.ORGANIZATION.UPDATE_ORGANIZATION,controller.updateOrganization.bind(controller))
router.post(API_ROUTES.ORGANIZATION.DELETE_ORGANIZATION,controller.deleteOrganization.bind(controller))
router.get(API_ROUTES.ORGANIZATION.GET_ALL_ORGANIZATIONS,controller.getAllOrganizations.bind(controller))
router.get(
    '/my-organization',
    authMiddleware as any,
    roleMiddleware(['organization-owner']) as any,
    controller.getMyOrganization.bind(controller)
)

export default router