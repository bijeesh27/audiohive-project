import { ISubscriptionDocument } from "../infrastructure/subscriptionSchema";



export interface IsubscriptionRepository{
    findSubscription(subscriptionName:string):Promise<ISubscriptionDocument|null>
    createSubscription(date:ISubscriptionDocument):Promise<void>
    updateSubscription(subscriptionId:string,data:Partial<ISubscriptionDocument>):Promise<void>
    deleteSubscription(subscriptionId:string):Promise<void>
    getAllSubscriptions():Promise<ISubscriptionDocument[]>
}