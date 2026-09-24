import { useEffect, useState } from 'react';
import { subscriptionService } from '../services/subscriptionServices';
import type { SubscriptionDTO } from '../services/subscriptionServices';
import { Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../config/axios';

const ChoosePlanPage = () => {
  const [plans, setPlans] = useState<SubscriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const organizationData = location.state;
  const ownerEmail = organizationData?.ownerEmail || "";

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

  const handleChoosePlan = async (plan: SubscriptionDTO) => {
    if (plan.price === 0) {
      // Free plan selected
      try {
        setSubscribingId(plan._id);
        await axiosInstance.post("/api/organization/send-invitation", { ownerEmail });
        navigate('/invitation-sent', { state: location.state });
      } catch (error) {
        console.error("Failed to send free plan invitation", error);
        setSubscribingId(null);
      }
    } else {
      // Priced plan selected
      try {
        setSubscribingId(plan._id);
        const response = await axiosInstance.post(
          "/api/subscription/create-checkout-session",
          { planId: plan._id, ownerEmail }
        );
        window.location.href = response.data.url;
      } catch (error) {
        console.error("Subscription checkout error:", error);
        setSubscribingId(null);
      }
    }
  };

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
          <h2 className="mt-6 text-3xl sm:text-4xl font-extrabold text-[#1A1B25] leading-tight tracking-tight">
            Choose Your <span className="text-indigo-600">Plan</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Select the subscription plan that best fits your organization's needs.
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
              <div className="mt-8 pt-4">
                <button
                  type="button"
                  disabled={subscribingId === plan._id}
                  onClick={() => handleChoosePlan(plan)}
                  className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-50"
                >
                  {subscribingId === plan._id ? "Processing..." : "Select Plan"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChoosePlanPage;
