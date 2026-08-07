import express from 'express'
import { SubscriptionRepository } from '../infrastructure/subcriptionRepository'
import { AuthController } from './subscription.controller'
import { CreateSubscriptionUseCase } from '../application/usecases/createSubcriptionUseCase'
import { UpdateSubscriptionUseCase } from '../application/usecases/updateSubscriptionUseCase'
import { DeleteSubcriptionUseCase } from '../application/usecases/deleteSubcriptionUseCase'
import { GetAllSubscriptionsUseCase } from '../application/usecases/getAllSubscriptionsUseCase'
import { API_ROUTES } from '../../../common/constant/ApiRoutes'

const router=express.Router()

const subscriptionRepository=new SubscriptionRepository()
const createSubscriptionUseCase=new CreateSubscriptionUseCase(subscriptionRepository)
const updateSubscriptionUseCase=new UpdateSubscriptionUseCase(subscriptionRepository)
const deleteSubscriptionUseCase=new DeleteSubcriptionUseCase(subscriptionRepository)
const getAllSubscriptionsUseCase=new GetAllSubscriptionsUseCase(subscriptionRepository)



const controller=new AuthController(
    createSubscriptionUseCase,
    updateSubscriptionUseCase,
    deleteSubscriptionUseCase,
    getAllSubscriptionsUseCase
)

router.post(API_ROUTES.SUBSCRIPTION.CREATE_SUBSCRIPTION,controller.createSubscription.bind(controller))
router.post(API_ROUTES.SUBSCRIPTION.UPDATE_SUBSCRIPTION,controller.updateSubscription.bind(controller))
router.post(API_ROUTES.SUBSCRIPTION.DELETE_SUBSCRIPTION,controller.deleteSubscription.bind(controller))
router.get(API_ROUTES.SUBSCRIPTION.GET_ALL_SUBSCRIPTIONS,controller.getAllSubscriptions.bind(controller))


export default router