import { NextFunction, Request,Response } from "express";
import { IuseCase } from "../../../shared/interface/IuseCase";
import { AllSubscriptionsDTO, createSubscriptionDTO, deleteSubscriptionDTO, updateSubscriptionDTO } from "../application/dto/subcriptionDTOs";
import { ISubscriptionDocument } from "../infrastructure/subscriptionSchema";
import { ApiResposne } from "../../../common/Response/Response";
import { MESSAGES } from "../../../common/constant/messages";


export class AuthController{
    constructor(
        private readonly createSubscriptionUseCase:IuseCase<createSubscriptionDTO,void>,
        private readonly updateSubscriptionUseCase:IuseCase<updateSubscriptionDTO,void>,
        private readonly deleteSubscriptionUseCase:IuseCase<deleteSubscriptionDTO,void>,
        private readonly getAllSubscriptionUseCase:IuseCase<AllSubscriptionsDTO,ISubscriptionDocument[]>,
        private readonly createCheckoutSessionUseCase:IuseCase<{ planId: string; ownerEmail?: string }, string>,
        private readonly verifyCheckoutSessionUseCase:IuseCase<string, { status: string; ownerEmail: string }>
    ){}

    async createCheckoutSession(req:Request, res:Response, next:NextFunction) {
        try {
            const { planId, ownerEmail } = req.body;
            if (!planId) {
                return res.status(400).json({ message: "planId is required" });
            }
            const sessionUrl = await this.createCheckoutSessionUseCase.execute({ planId, ownerEmail });
            return res.json({ url: sessionUrl });
        } catch (error: any) {
            if (error.message === "Subscription plan not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "Stripe price is not configured for this plan") {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Unable to create checkout session" });
        }
    }

    async verifyCheckoutSession(req:Request, res:Response, next:NextFunction) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) {
                return res.status(400).json({ message: "sessionId is required" });
            }
            const data = await this.verifyCheckoutSessionUseCase.execute(sessionId);
            return res.json(data);
        } catch (error: any) {
            console.error("verifyCheckoutSession Error:", error);
            return res.status(500).json({ message: error.message || "Unable to verify checkout session" });
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
            const payload: updateSubscriptionDTO = {
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