import React, { useEffect, useState } from 'react'
import { subscriptionService } from '../../services/subscriptionServices'
interface ISubscription {
  _id: string;
  subscriptionName: string;
  price: number;
  description: string;
  maxRooms: number;
  maxUsers: number;
  features: string[];
  isActive: boolean;
}

const SubscriptionPlan = () => {
    const [plans,setPlans]=useState<ISubscription[]>([])
    useEffect(()=>{
        subscriptionService.getAllSubscriptions().then(res=>setPlans(res.data))
    },[])
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {plans.map((plan) => (
    <div
      key={plan._id}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {plan.subscriptionName}
        </h3>

        <p className="mt-2 text-sm text-gray-500 leading-5">
          {plan.description}
        </p>
      </div>

      
      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold text-gray-900">
            ₹{plan.price}
          </span>

          <span className="text-sm text-gray-500 mb-1">
            /month
          </span>
        </div>
      </div>

      
      <div className="border-t border-gray-100 pt-5 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Maximum Rooms
          </span>

          <span className="text-sm font-semibold text-gray-900">
            {plan.maxRooms}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Maximum Users
          </span>

          <span className="text-sm font-semibold text-gray-900">
            {plan.maxUsers}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Features
        </h4>

        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-gray-600"
            >
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-50 text-green-600">
                ✓
              </span>

              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      
      <div className="mt-6 pt-5 border-t border-gray-100">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            plan.isActive
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {plan.isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  ))}
</div>
  )
}

export default SubscriptionPlan
