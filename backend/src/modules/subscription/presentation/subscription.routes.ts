import { ActivityLogRepository } from "../../activityLog/infrastructure/activitylogRepository";
const activityLogRepository = new ActivityLogRepository();
import express from 'express'
import { SubscriptionRepository } from '../infrastructure/subcriptionRepository'
import { AuthController } from './subscription.controller'
import { CreateSubscriptionUseCase } from '../application/usecases/createSubcriptionUseCase'
import { UpdateSubscriptionUseCase } from '../application/usecases/updateSubscriptionUseCase'
import { DeleteSubcriptionUseCase } from '../application/usecases/deleteSubcriptionUseCase'
import { GetAllSubscriptionsUseCase } from '../application/usecases/getAllSubscriptionsUseCase'
import { CreateCheckoutSessionUseCase } from '../application/usecases/createCheckoutSessionUseCase'
import { VerifyCheckoutSessionUseCase } from '../application/usecases/verifyCheckoutSessionUseCase'
import { API_ROUTES } from '../../../common/constant/ApiRoutes'

import { validateRequest } from "../../../middleware/validateRequest";
import { createSubscriptionSchema, updateSubscriptionSchema } from "../../../common/validation/formValidation";

const router=express.Router()

const subscriptionRepository=new SubscriptionRepository()
const createSubscriptionUseCase=new CreateSubscriptionUseCase(subscriptionRepository,activityLogRepository)
const updateSubscriptionUseCase=new UpdateSubscriptionUseCase(subscriptionRepository,activityLogRepository)
const deleteSubscriptionUseCase=new DeleteSubcriptionUseCase(subscriptionRepository,activityLogRepository)
const getAllSubscriptionsUseCase=new GetAllSubscriptionsUseCase(subscriptionRepository)
const createCheckoutSessionUseCase = new CreateCheckoutSessionUseCase(subscriptionRepository,activityLogRepository)
const verifyCheckoutSessionUseCase = new VerifyCheckoutSessionUseCase(activityLogRepository)



const controller=new AuthController(
    createSubscriptionUseCase,
    updateSubscriptionUseCase,
    deleteSubscriptionUseCase,
    getAllSubscriptionsUseCase,
    createCheckoutSessionUseCase,
    verifyCheckoutSessionUseCase
)

router.post(API_ROUTES.SUBSCRIPTION.CREATE_SUBSCRIPTION, validateRequest(createSubscriptionSchema), controller.createSubscription.bind(controller))
router.post(API_ROUTES.SUBSCRIPTION.UPDATE_SUBSCRIPTION, validateRequest(updateSubscriptionSchema), controller.updateSubscription.bind(controller))
router.post(API_ROUTES.SUBSCRIPTION.DELETE_SUBSCRIPTION,controller.deleteSubscription.bind(controller))
router.get(API_ROUTES.SUBSCRIPTION.GET_ALL_SUBSCRIPTIONS,controller.getAllSubscriptions.bind(controller))
router.post(API_ROUTES.SUBSCRIPTION.CREATE_CHECKOUT_SESSION, controller.createCheckoutSession.bind(controller))
router.post(API_ROUTES.SUBSCRIPTION.VERIFY_SESSION, controller.verifyCheckoutSession.bind(controller))


export default router