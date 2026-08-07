import { BaseRepository } from "../../../shared/common/baseRepository";
import { IsubscriptionRepository } from "../domain/IsubscriptionRepository";
import { ISubscriptionDocument } from "./subscriptionSchema";
import { SubscriptionModel } from "./subscriptionSchema";

export class SubscriptionRepository
  extends BaseRepository<ISubscriptionDocument>
  implements IsubscriptionRepository
{
  constructor() {
    super(SubscriptionModel);
  }
  async findSubscription(subscriptionName:string):Promise<ISubscriptionDocument|null>{
    const subscription= await this.findOne({subscriptionName})
    return subscription
  }

  async createSubscription(data: ISubscriptionDocument):Promise< void >{
      await this.create(data)
  }

  async updateSubscription(subscriptionId: string, data: Partial<ISubscriptionDocument>): Promise<void> {
    await this.update(subscriptionId,data)
  }
  async deleteSubscription(subscriptionId: string): Promise<void> {
    await this.delete(subscriptionId)
  }
  async getAllSubscriptions(): Promise<ISubscriptionDocument[]> {
   return await SubscriptionModel.find()
  }
}
