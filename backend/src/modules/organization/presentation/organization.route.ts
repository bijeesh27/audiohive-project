

import express from 'express'
import { OrganizationController } from './organization.controller'
import { OrganizationRepository } from '../infrastructure/organizationRepository'
import { CreateOrganizationUseCase } from '../application/usecases/createOrganizationUseCase'
import { UpdateOrganizationUseCase } from '../application/usecases/updateOrganizationUseCase'
import { DeleteOrganizationUseCase } from '../application/usecases/deleteOrganizationUseCase'
import { GetAllOrganizationUseCase } from '../application/usecases/getAllOrganizationUseCase'
import { API_ROUTES } from '../../../common/constant/ApiRoutes'

const router=express.Router()


const organizationRepository=new OrganizationRepository()
const createOrganizationUseCase=new CreateOrganizationUseCase(organizationRepository)
const updateOrganizationUseCase=new UpdateOrganizationUseCase(organizationRepository)
const deleteOrganizationUseCase=new DeleteOrganizationUseCase(organizationRepository)
const getAllOrganizationUseCase=new GetAllOrganizationUseCase(organizationRepository)



const controller=new OrganizationController(
createOrganizationUseCase,
updateOrganizationUseCase,
deleteOrganizationUseCase,
getAllOrganizationUseCase
)





router.post(API_ROUTES.ORGANIZATION.CREATE_ORGANIZATION,controller.createOrganization.bind(controller))
router.post(API_ROUTES.ORGANIZATION.UPDATE_ORGANIZATION,controller.updateOrganization.bind(controller))
router.post(API_ROUTES.ORGANIZATION.DELETE_ORGANIZATION,controller.deleteOrganization.bind(controller))
router.get(API_ROUTES.ORGANIZATION.GET_ALL_ORGANIZATIONS,controller.getAllOrganizations.bind(controller))

export default router