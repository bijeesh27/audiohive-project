

import express from 'express'
import { OrganizationController } from './organization.controller'
import { OrganizationRepository } from '../infrastructure/organizationRepository'
import { CreateOrganizationUseCase } from '../application/usecases/createOrganizationUseCase'
import { SendOrganizationInvitationUseCase } from '../application/usecases/sendOrganizationInvitationUseCase'
import { UpdateOrganizationUseCase } from '../application/usecases/updateOrganizationUseCase'
import { DeleteOrganizationUseCase } from '../application/usecases/deleteOrganizationUseCase'
import { GetAllOrganizationUseCase } from '../application/usecases/getAllOrganizationUseCase'
import { GetMyOrganizationUseCase } from '../application/usecases/getMyOrganizationUseCase'
import { GetAllOrganizationUsersUseCase } from '../application/usecases/getAllOrganizationUsersUseCase'
import { GetOrgDashboardStatsUseCase } from '../application/usecases/getOrgDashboardStatsUseCase'
import { API_ROUTES } from '../../../common/constant/ApiRoutes'
import { validateRequest } from "../../../middleware/validateRequest";
import { createOrganizationSchema, updateOrganizationSchema } from "../../../common/validation/formValidation";
import { authMiddleware, roleMiddleware } from '../../../middleware/authMiddleware'
import { UserRoles } from '../../../common/constant/userRoles'

const router=express.Router()


const organizationRepository=new OrganizationRepository()
const createOrganizationUseCase=new CreateOrganizationUseCase(organizationRepository)
const updateOrganizationUseCase=new UpdateOrganizationUseCase(organizationRepository)
const deleteOrganizationUseCase=new DeleteOrganizationUseCase(organizationRepository)
const getAllOrganizationUseCase=new GetAllOrganizationUseCase(organizationRepository)
const getMyOrganizationUseCase=new GetMyOrganizationUseCase(organizationRepository)
const getAllOrganizationUsersUseCase=new GetAllOrganizationUsersUseCase(organizationRepository)
const getOrgDashboardStatsUseCase=new GetOrgDashboardStatsUseCase(organizationRepository)
const sendOrganizationInvitationUseCase = new SendOrganizationInvitationUseCase(organizationRepository)



const controller=new OrganizationController(
createOrganizationUseCase,
updateOrganizationUseCase,
deleteOrganizationUseCase,
getAllOrganizationUseCase,
getMyOrganizationUseCase,
getAllOrganizationUsersUseCase,
getOrgDashboardStatsUseCase,
sendOrganizationInvitationUseCase
)





router.post(API_ROUTES.ORGANIZATION.CREATE_ORGANIZATION, validateRequest(createOrganizationSchema), controller.createOrganization.bind(controller))
router.post('/send-invitation', controller.sendInvitation.bind(controller))
router.post(API_ROUTES.ORGANIZATION.UPDATE_ORGANIZATION, validateRequest(updateOrganizationSchema), controller.updateOrganization.bind(controller))
router.post(API_ROUTES.ORGANIZATION.DELETE_ORGANIZATION, controller.deleteOrganization.bind(controller))
router.get(API_ROUTES.ORGANIZATION.GET_ALL_ORGANIZATIONS,controller.getAllOrganizations.bind(controller))
router.get(
    API_ROUTES.ORGANIZATION.GET_MY_ORGANIZATION,
    authMiddleware ,
    roleMiddleware([UserRoles.ORGANIZATION_OWNER]) ,
    controller.getMyOrganization.bind(controller)
)
router.get(
    API_ROUTES.ORGANIZATION.GET_USERS,
    authMiddleware,
    roleMiddleware([UserRoles.ORGANIZATION_OWNER]) ,
    controller.getOrganizationUsers.bind(controller)
)
router.get(
    API_ROUTES.ORGANIZATION.DASHBOARD_STATS,
    authMiddleware,
    roleMiddleware([UserRoles.ORGANIZATION_OWNER]),
    controller.getOrgDashboardStats.bind(controller)
)

export default router