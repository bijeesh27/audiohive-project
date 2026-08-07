import { Check, Edit, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import SubscriptionPlanModal, {
  type ISubscriptionForm,
} from "../../components/subscription/SubscriptionPlanModal";
import { subscriptionService } from "../../services/subscriptionServices";

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

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<ISubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editingPlan, setEditingPlan] =
    useState<ISubscription | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await subscriptionService.getAllSubscriptions();
      setPlans(res.data);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async (
    data: ISubscriptionForm
  ) => {
    try {
      if (editingPlan) {
        await subscriptionService.updateSubscription(
          editingPlan._id,
          data
        );
      } else {
        await subscriptionService.createSubscription(
          data
        );
      }

      setOpenModal(false);
      setEditingPlan(null);

      fetchPlans();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        Loading subscription plans...
      </div>
    );
  }

  return (
    <>
      <div className="p-8">

        {/* Header */}

        <div className="flex justify-between items-center">

          <div>
            <h1 className="text-3xl font-bold">
              Subscription Plans
            </h1>

            <p className="text-gray-500 mt-2">
              Manage and configure available billing plans.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingPlan(null);
              setOpenModal(true);
            }}
            className="bg-blue-600 text-white px-5 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Create New Plan
          </button>

        </div>

        {/* Empty */}

        {plans.length === 0 ? (
          <div className="mt-10 border rounded-xl p-10 text-center">
            <h2 className="text-xl font-semibold">
              No Plans Found
            </h2>

            <p className="text-gray-500 mt-2">
              Create your first subscription.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">

            {plans.map((plan) => (
              <div
                key={plan._id}
                className="bg-white rounded-2xl border shadow-sm p-7 flex flex-col"
              >
                <h2 className="text-xl font-semibold">
                  {plan.subscriptionName}
                </h2>

                <p className="text-gray-500 mt-2">
                  {plan.description}
                </p>

                <div className="mt-6">
                  <span className="text-4xl font-bold">
                    ₹{plan.price}
                  </span>

                  <span className="text-gray-500 ml-2">
                    /month
                  </span>
                </div>

                <div className="mt-6 bg-gray-50 rounded-lg p-4 space-y-2">

                  <div className="flex justify-between">
                    <span>Maximum Users</span>

                    <span>{plan.maxUsers}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Maximum Rooms</span>

                    <span>{plan.maxRooms}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Status</span>

                    <span
                      className={
                        plan.isActive
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {plan.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                </div>

                <div className="mt-6 flex-1">

                  <h3 className="font-semibold mb-3">
                    Features
                  </h3>

                  <ul className="space-y-3">

                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex gap-3"
                      >
                        <Check
                          className="text-blue-600"
                          size={18}
                        />

                        <span>{feature}</span>
                      </li>
                    ))}

                  </ul>

                </div>

                <button
                  onClick={() => {
                    setEditingPlan(plan);
                    setOpenModal(true);
                  }}
                  className="mt-8 border rounded-lg py-3 flex justify-center items-center gap-2 hover:bg-gray-100"
                >
                  <Edit size={18} />
                  Edit Plan
                </button>

              </div>
            ))}

          </div>
        )}

      </div>

      <SubscriptionPlanModal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingPlan(null);
        }}
        loading={false}
        initialData={
          editingPlan
            ? {
                subscriptionName:
                  editingPlan.subscriptionName,
                description:
                  editingPlan.description,
                price: editingPlan.price,
                maxUsers: editingPlan.maxUsers,
                maxRooms: editingPlan.maxRooms,
                features: editingPlan.features,
                isActive: editingPlan.isActive,
              }
            : null
        }
        onSubmit={handleSubmit}
      />
    </>
  );
}