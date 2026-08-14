import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { subscriptionService } from "../services/subscriptionServices";
import { createWorkspace } from "../services/workspaceServices";
import { isAxiosError } from "axios";
import { API_ROUTES } from "../constants/Api_Routes";

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

interface IFormData {
  companyName: string;
  workspaceAdminName: string;
  workspaceAdminEmail: string;
  workspaceSlug: string;
}

const CreateWorkspace = () => {
  const navigate = useNavigate();

  const [plans, setPlans] = useState<ISubscription[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<IFormData>({
    companyName: "",
    workspaceAdminName: "",
    workspaceAdminEmail: "",
    workspaceSlug: "",
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);

        const response = await subscriptionService.getAllSubscriptions();

        setPlans(response.data);

        if (response.data.length > 0) {
          setSelectedPlan(response.data[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch subscription plans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContinue = async () => {
    if (
      !formData.companyName.trim() ||
      !formData.workspaceAdminName.trim() ||
      !formData.workspaceAdminEmail.trim() ||
      !formData.workspaceSlug.trim()
    ) {
      return;
    }

    if (!selectedPlan) {
      return;
    }

    const plan = plans.find((subscription) => subscription._id === selectedPlan);

    if (!plan) {
      return;
    }

    setFieldErrors([]);
    setError(null);
    setIsLoading(true);

    const workspaceData = {
      companyName: formData.companyName.trim(),
      workspaceAdminName: formData.workspaceAdminName.trim(),
      workspaceAdminEmail: formData.workspaceAdminEmail.trim(),
      planId: plan._id,
      status: 'pending',
      workspaceSlug: formData.workspaceSlug.trim().toLowerCase(),
      amountPaid: plan.price,
    };

    try {
      await createWorkspace(workspaceData);

      if (plan.price === 0) {
        navigate(API_ROUTES.PUBLIC.NAV.PENDING_APPROVAL, {
          state: workspaceData,
        });
      } else {
        navigate(API_ROUTES.PUBLIC.NAV.PAYMENT, {
          state: workspaceData,
        });
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const data = err?.response?.data;
        const raw = data?.errors;
        const fields: { field: string; message: string }[] = Array.isArray(raw) ? raw : [];
        if (fields.length > 0) {
          setFieldErrors(fields.map((e) => e.message));
        } else {
          setError(data?.message || "Failed to create workspace");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-lg font-semibold text-brand-text">AudioHive</span>
          </div>

          <button
            type="button"
            onClick={() => navigate(API_ROUTES.PUBLIC.NAV.LOGIN)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Create Your Workspace
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-500">
            Tell us a bit about your organization and select a plan
            that fits your needs.
          </p>
        </div>

        <section className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">
            <Building2 size={20} className="text-gray-700" />
            <h2 className="text-sm font-semibold text-gray-900">
              Organization Details
            </h2>
          </div>

          {error && (
            <div className="mt-4 mx-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {fieldErrors.length > 0 && (
            <div className="mt-4 mx-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <ul className="list-disc list-inside space-y-1">
                {fieldErrors.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. Acme Corporation"
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Workspace Admin Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="workspaceAdminName"
                value={formData.workspaceAdminName}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Workspace Admin Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="workspaceAdminEmail"
                value={formData.workspaceAdminEmail}
                onChange={handleChange}
                placeholder="admin@acmecorp.com"
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Workspace Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="workspaceSlug"
                value={formData.workspaceSlug}
                onChange={handleChange}
                placeholder="e.g. acme-corp"
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                This will be used as your workspace identifier.
              </p>
            </div>
          </div>
        </section>

        {/* Select Plan */}
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">
            <CreditCard size={20} className="text-gray-700" />
            <h2 className="text-sm font-semibold text-gray-900">
              Select a Plan
            </h2>
          </div>

          {isLoading && plans.length === 0 ? (
            <div className="flex justify-center py-12">
              <p className="text-sm text-gray-500">
                Loading subscription plans...
              </p>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex justify-center py-12">
              <p className="text-sm text-gray-500">
                No subscription plans available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan._id;

                return (
                  <button
                    key={plan._id}
                    type="button"
                    onClick={() => setSelectedPlan(plan._id)}
                    className={`relative flex min-h-[320px] flex-col rounded-lg border p-5 text-left transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-bold ${
                          isSelected
                            ? "text-blue-600"
                            : "text-gray-900"
                        }`}
                      >
                        {plan.subscriptionName}
                      </h3>

                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-baseline">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold text-gray-900">
                          Free
                        </span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-gray-900">
                            ${plan.price}
                          </span>
                          <span className="ml-1 text-xs text-gray-500">
                            /mo
                          </span>
                        </>
                      )}
                    </div>

                    <p className="mt-4 min-h-[55px] text-xs leading-5 text-gray-500">
                      {plan.description}
                    </p>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Check
                          size={15}
                          strokeWidth={2.5}
                          className="shrink-0 text-gray-900"
                        />
                        <span className="text-xs text-gray-700">
                          Up to {plan.maxUsers} Users
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Check
                          size={15}
                          strokeWidth={2.5}
                          className="shrink-0 text-gray-900"
                        />
                        <span className="text-xs text-gray-700">
                          {plan.maxRooms} Virtual Rooms
                        </span>
                      </div>

                      {plan.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-2"
                        >
                          <Check
                            size={15}
                            strokeWidth={2.5}
                            className="shrink-0 text-gray-900"
                          />
                          <span className="text-xs text-gray-700">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end border-t border-gray-200 px-6 py-5">
            <button
              type="button"
              onClick={handleContinue}
              disabled={
                !selectedPlan ||
                isLoading ||
                !formData.companyName.trim() ||
                !formData.workspaceAdminName.trim() ||
                !formData.workspaceAdminEmail.trim() ||
                !formData.workspaceSlug.trim()
              }
              className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {plans.find((plan) => plan._id === selectedPlan)?.price === 0
                ? "Submit Request"
                : "Continue To Payment"}

              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CreateWorkspace;