import { NextFunction, Request, Response } from "express";
import { IuseCase } from "../../../shared/interface/IuseCase";
import { ApiResposne } from "../../../common/Response/Response";


export class ActivityLogController{
    constructor(
        private readonly recordActivityLogUseCase:IuseCase<any,any>
    ){}
    async recordActivityLog(req:Request,res:Response,next:NextFunction){
        try {
            const activityLog=await this.recordActivityLogUseCase.execute(req.body)
            return ApiResposne.success(res,"",activityLog)
        } catch (error) {
            next(error)
        }
    }
}