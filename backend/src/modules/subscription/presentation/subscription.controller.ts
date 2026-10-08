import { NextFunction, Request,Response } from "express";
import { IuseCase } from "../../../shared/interface/IuseCase";
import {
    CreateCheckoutSessionDTO,
    CreateSubscriptionDTO,
    DeleteSubscriptionDTO,
    UpdateSubscriptionDTO,
    VerifyCheckoutSessionDTO,
    VerifyCheckoutSessionResultDTO,
} from "../application/dto/subcriptionDTOs";
import { ISubscriptionDocument } from "../infrastructure/subscriptionSchema";
import { ApiResposne } from "../../../common/Response/Response";
import { MESSAGES } from "../../../common/constant/messages";
import { AppError } from "../../../common/Errors/AppError";

export class AuthController{
    constructor(
        private readonly createSubscriptionUseCase:IuseCase<CreateSubscriptionDTO,void>,
        private readonly updateSubscriptionUseCase:IuseCase<UpdateSubscriptionDTO,void>,
        private readonly deleteSubscriptionUseCase:IuseCase<DeleteSubscriptionDTO,void>,
        private readonly getAllSubscriptionUseCase:IuseCase<void,ISubscriptionDocument[]>,
        private readonly createCheckoutSessionUseCase:IuseCase<CreateCheckoutSessionDTO, string>,
        private readonly verifyCheckoutSessionUseCase:IuseCase<VerifyCheckoutSessionDTO, VerifyCheckoutSessionResultDTO>
    ){}

    async createCheckoutSession(req:Request, res:Response, next:NextFunction) {
        try {
            const { planId, ownerEmail, companyName, slug, ownerName } = req.body;
            if (!planId) {
                throw new AppError("planId is required", 400);
            }
            const sessionUrl = await this.createCheckoutSessionUseCase.execute({ planId, ownerEmail, companyName, slug, ownerName });
            return ApiResposne.success(res, MESSAGES.SUCCESS.CHECKOUT_SESSION_CREATED, { url: sessionUrl });
        } catch (error: unknown) {
            next(error)
        }
    }

    async verifyCheckoutSession(req:Request, res:Response, next:NextFunction) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) {
                throw new AppError("sessionId is required", 400);
            }
            const data = await this.verifyCheckoutSessionUseCase.execute({ sessionId });
            return ApiResposne.success(res, MESSAGES.SUCCESS.CHECKOUT_SESSION_VERIFIED, data);
        } catch (error: unknown) {
            next(error)
        }
    }

    async createSubscription(req:Request,res:Response,next:NextFunction){
       try {
         const response= await this.createSubscriptionUseCase.execute(req.body)
         return ApiResposne.success(res,MESSAGES.SUCCESS.SUBSCRIPTION_CREATED,response)
         
       } catch (error) {
        next(error)
       }
    }
    async updateSubscription(req:Request,res:Response,next:NextFunction){
        try {
            const payload: UpdateSubscriptionDTO = {
                id: req.body.subscriptionId,
                ...req.body.data
            };
            const updatedSubscription=await this.updateSubscriptionUseCase.execute(payload)
            return ApiResposne.success(res,MESSAGES.SUCCESS.SUBSCRIPTION_UPDATED,updatedSubscription)
        } catch (error) {
            next(error)
        }
    }

    async deleteSubscription(req:Request,res:Response,next:NextFunction){
        try {
            const deletedsubscription=await this.deleteSubscriptionUseCase.execute(req.body)
            return ApiResposne.success(res,MESSAGES.SUCCESS.SUBSCRIPTION_DELETED,deletedsubscription)
        } catch (error) {
            next(error)
        }
    }
    async getAllSubscriptions(req:Request,res:Response,next:NextFunction){
        try {
            const allSubscriptions=await this.getAllSubscriptionUseCase.execute()
            return ApiResposne.success(res,MESSAGES.SUCCESS.GET_ALL_SUBSCRIPTIONS,allSubscriptions)
        } catch (error) {
            next(error)
        }
    }
}
