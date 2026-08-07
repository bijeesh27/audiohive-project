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
        private readonly getAllSubscriptionUseCase:IuseCase<AllSubscriptionsDTO,ISubscriptionDocument[]>
    ){}

    async createSubscription(req:Request,res:Response,next:NextFunction):Promise<any>{
       try {
         const response= await this.createSubscriptionUseCase.execute(req.body)
         return ApiResposne.success(res,MESSAGES.SUCCESS.SUBSCRIPTION_CREATED,response)
         
       } catch (error) {
        next(error)
       }
    }
    async updateSubscription(req:Request,res:Response,next:NextFunction):Promise<any>{
        try {
            const updatedSubscription=await this.updateSubscriptionUseCase.execute(req.body)
            return ApiResposne.success(res,MESSAGES.SUCCESS.SUBSCRIPTION_UPDATED,updatedSubscription)
        } catch (error) {
            next(error)
        }
    }

    async deleteSubscription(req:Request,res:Response,next:NextFunction):Promise<any>{
        try {
            const deletedsubscription=await this.deleteSubscriptionUseCase.execute(req.body)
            return ApiResposne.success(res,MESSAGES.SUCCESS.SUBSCRIPTION_DELETED,deletedsubscription)
        } catch (error) {
            console.log(error)
        }
    }
    async getAllSubscriptions(req:Request,res:Response,next:NextFunction):Promise<any>{
        try {
            const allSubscriptions=await this.getAllSubscriptionUseCase.execute()
            return ApiResposne.success(res,MESSAGES.SUCCESS.GET_ALL_SUBSCRIPTIONS,allSubscriptions)
        } catch (error) {
            console.log(error)
        }
    }
}