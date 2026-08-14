import React, { useEffect, useState } from 'react';
import { subscriptionService } from '../services/subscriptionServices';
import type { SubscriptionDTO } from '../services/subscriptionServices';
import { CheckCircle2 } from 'lucide-react';

const PricingPage = () => {
  const [plans, setPlans] = useState<SubscriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await subscriptionService.getAllSubscriptions();
        setPlans(response.data || []);
      } catch (error) {
        console.error("Failed to fetch plans", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-600">Loading plans...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Choose the right plan for your workspace
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Simple, transparent pricing that grows with you.
        </p>
      </div>

      <div className="mt-20 max-w-7xl mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {plans.filter(plan => plan.isActive !== false).map((plan) => (
          <div key={plan._id} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300 flex flex-col">
            <div className="p-8 sm:p-10 flex-grow">
              <h3 className="text-2xl font-bold text-gray-900" id={`tier-${plan.subscriptionName}`}>
                {plan.subscriptionName}
              </h3>
              <p className="mt-4 text-gray-500 line-clamp-2">{plan.description}</p>
              
              <div className="mt-8 flex items-baseline text-5xl font-extrabold text-gray-900">
                ${plan.price}
                <span className="ml-1 text-xl font-medium text-gray-500">/mo</span>
              </div>
              
              <ul role="list" className="mt-8 space-y-4">
                <li className="flex items-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-600">Up to <strong>{plan.maxUsers}</strong> users</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-600">Up to <strong>{plan.maxRooms}</strong> rooms</span>
                </li>
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mr-3" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
        
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;