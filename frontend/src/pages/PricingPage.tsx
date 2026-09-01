import  { useEffect, useState } from 'react';
import { subscriptionService } from '../services/subscriptionServices';
import type { SubscriptionDTO } from '../services/subscriptionServices';
import { Check } from 'lucide-react';

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
    return (
      <div className="flex justify-center items-center h-screen bg-[#F7F8FC]">
        <div className="flex items-center gap-3 text-[#1A1B25]">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse" />
          <span className="text-sm font-medium">Loading plans...</span>
        </div>
      </div>
    );
  }

  const activePlans = plans.filter((plan) => plan.isActive !== false);

  return (
    <div className="min-h-screen bg-[#F7F8FC] py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
         
          <h2 className="mt-6 text-4xl sm:text-5xl font-extrabold text-[#1A1B25] leading-tight tracking-tight">
            A plan for every
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              size of workspace
            </span>
          </h2>
          <p className="mt-5 text-lg text-gray-500">
            Scale users and rooms as your team grows. Cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-8 flex flex-col"
            >
              <h3 className="text-xl font-bold text-[#1A1B25]">
                {plan.subscriptionName}
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                {plan.description}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[#1A1B25] tracking-tight">
                  ₹{plan.price}
                </span>
                <span className="text-sm font-medium text-gray-400">/mo</span>
              </div>

              <ul className="mt-8 space-y-3.5 pt-6 border-t border-gray-100">
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="h-5 w-5 mt-0.5 text-indigo-600 shrink-0" strokeWidth={2.5} />
                  <span>Up to <strong>{plan.maxUsers}</strong> users</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="h-5 w-5 mt-0.5 text-indigo-600 shrink-0" strokeWidth={2.5} />
                  <span>Up to <strong>{plan.maxRooms}</strong> rooms</span>
                </li>
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                    <Check className="h-5 w-5 mt-0.5 text-indigo-600 shrink-0" strokeWidth={2.5} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;