import { useEffect, useState } from "react";
import { getMyOrganization } from "../../services/organizationServices";
import { subscriptionService } from "../../services/subscriptionServices";

interface ISubscription {
  _id: string;
  subscriptionName: string;
  price: number;
  description: string;
  maxWorkspaces: number;
  features: string[];
  isActive: boolean;
}

const SubscriptionDetails = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<ISubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const orgRes = await getMyOrganization();
        const orgPlanId = orgRes.data?.planId;

        if (!orgPlanId) {
          throw new Error("No plan assigned to this organization.");
        }

        const plansRes = await subscriptionService.getAllSubscriptions();
        const allPlans: ISubscription[] = plansRes.data || [];
        
        // Find the subscription matching the organization's planId (case-insensitive)
        const myPlan = allPlans.find(
          (p) => p.subscriptionName.toLowerCase() === orgPlanId.toLowerCase()
        );

        if (myPlan) {
          setSubscription(myPlan);
        } else {
          throw new Error("Current plan details not found.");
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Failed to load subscription details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Subscription Details</h1>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
          Loading subscription details...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : subscription ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm max-w-2xl">
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600 mb-2">Current Plan</h2>
            <h3 className="text-3xl font-bold text-gray-900">
              {subscription.subscriptionName}
            </h3>
            <p className="mt-3 text-base text-gray-600 leading-relaxed">
              {subscription.description}
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-end gap-1">
              <span className="text-5xl font-bold text-gray-900">
                ₹{subscription.price}
              </span>
              <span className="text-base text-gray-500 mb-1">/month</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 mb-8">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Plan Limits</h4>
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Maximum Workspaces</span>
              <span className="text-sm font-bold text-indigo-700">{subscription.maxWorkspaces}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Included Features</h4>
            <ul className="space-y-4">
              {subscription.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-base text-gray-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {!subscription.isActive && (
            <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Plan Legacy Notice</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This plan is no longer offered for new subscriptions, but your current access remains unaffected.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SubscriptionDetails;
