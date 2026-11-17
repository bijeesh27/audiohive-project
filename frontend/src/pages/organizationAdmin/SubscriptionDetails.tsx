import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Check,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  X,
  RotateCcw,
  Layers,
  DoorOpen,
  Users as UsersIcon,
  Calendar,
  CreditCard,
  Building2,
} from "lucide-react";
import { useOrganization } from "../../context/OrganizationContext";
import {
  subscriptionService,
  type MySubscriptionData,
  type SubscriptionDTO,
} from "../../services/subscriptionServices";

// Clean legacy duplicate/hardcoded workspace and room limit strings from raw plan features
const cleanPlanFeatures = (features: string[] = []): string[] => {
  return features.filter((f) => {
    const trimmed = f.trim();
    if (/^(?:up\s+to\s+)?\d+\s*workspaces?$/i.test(trimmed)) return false;
    if (/^(?:up\s+to\s+)?\d+\s*rooms?(?:\s+per\s+workspace)?$/i.test(trimmed)) return false;
    return true;
  });
};

interface ToastState {
  message: string;
  type: "success" | "error" | "warning";
}

export default function SubscriptionDetails() {
  const [searchParams] = useSearchParams();
  const { refreshOrganization } = useOrganization();

  const [data, setData] = useState<MySubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upgrade / Downgrade modal state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionDTO | null>(null);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Verification overlay state
  const [isVerifying, setIsVerifying] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  }, []);

  // Fetch full subscription details and usage from backend
  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await subscriptionService.getMySubscription();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          "Failed to load subscription details. Please retry."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  // Handle return from Stripe checkout
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const upgradeStatus = searchParams.get("upgrade_status");

    if (upgradeStatus === "cancelled") {
      showToast("Subscription checkout was cancelled. No changes were made to your plan.", "warning");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (sessionId && upgradeStatus === "success") {
      const verifySession = async () => {
        setIsVerifying(true);
        try {
          const res = await subscriptionService.verifyUpgrade(sessionId);
          showToast(res.data?.message || "Plan updated successfully!", "success");
          await refreshOrganization();
          await fetchSubscriptionData();
        } catch (err: unknown) {
          const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
          showToast(
            errorObj?.response?.data?.message || "Failed to verify subscription payment.",
            "error"
          );
        } finally {
          setIsVerifying(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      verifySession();
    }
  }, [searchParams, showToast, refreshOrganization, fetchSubscriptionData]);

  const currentPlan = data?.currentPlan;
  const usage = data?.usage;
  const availablePlans = data?.availablePlans || [];

  // Determine if the user is on the highest available paid tier
  const isHighestPlan = useMemo(() => {
    if (!currentPlan || availablePlans.length === 0) return false;
    const maxPrice = Math.max(...availablePlans.map((p) => p.price));
    return currentPlan.price >= maxPrice && currentPlan.price > 0;
  }, [currentPlan, availablePlans]);

  // Calculate if downgrade is blocked for the selected plan
  const downgradeBlockReason = useMemo(() => {
    if (!selectedPlan || !usage || !currentPlan) return null;
    if (selectedPlan.price >= currentPlan.price) return null;

    if (usage.workspaces.current > selectedPlan.maxWorkspaces) {
      return `You currently have ${usage.workspaces.current} workspaces, but the ${selectedPlan.subscriptionName} plan allows a maximum of ${selectedPlan.maxWorkspaces}. You must delete or archive ${usage.workspaces.current - selectedPlan.maxWorkspaces} workspace(s) before downgrading.`;
    }
    return null;
  }, [selectedPlan, usage, currentPlan]);

  // Handle confirming Upgrade or Downgrade
  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return;

    if (downgradeBlockReason) {
      setActionError(downgradeBlockReason);
      return;
    }

    try {
      setIsProcessingUpgrade(true);
      setActionError(null);

      const res = await subscriptionService.upgradeSubscription(selectedPlan._id!);

      if (res.data?.directUpdate) {
        // Direct Free / Downgrade switch without Stripe
        showToast(res.data.message || `Switched to ${selectedPlan.subscriptionName} plan.`, "success");
        setSelectedPlan(null);
        await refreshOrganization();
        await fetchSubscriptionData();
      } else if (res.data?.checkoutUrl) {
        // Redirect to Stripe Checkout session
        window.location.assign(res.data.checkoutUrl);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          "Failed to initiate plan change. Please try again."
      );
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  // Helper for progress bar color
  const getProgressColor = (percent: number, status: string) => {
    if (status === "exceeded" || percent >= 100) return "bg-rose-500";
    if (status === "warning" || percent >= 80) return "bg-amber-500";
    return "bg-indigo-600";
  };

  const getTextColor = (percent: number, status: string) => {
    if (status === "exceeded" || percent >= 100) return "text-rose-600";
    if (status === "warning" || percent >= 80) return "text-amber-600";
    return "text-indigo-600";
  };

  // Format subscription start date
  const formattedStartDate = useMemo(() => {
    if (!data?.organization?.createdAt) return "N/A";
    try {
      return new Date(data.organization.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  }, [data?.organization?.createdAt]);

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : toast.type === "warning"
              ? "bg-amber-600 text-white border-amber-500"
              : "bg-rose-600 text-white border-rose-500"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          {toast.type === "warning" && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === "error" && <XCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="max-w-md">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-md hover:bg-black/10 transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Verification Overlay */}
      {isVerifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 animate-spin">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Verifying Payment</h3>
              <p className="text-xs text-gray-500 mt-1">
                Please wait while we confirm your subscription update with Stripe...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subscription</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your organization plan, track real-time resource limits, and upgrade capacity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSubscriptionData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:opacity-50"
            aria-label="Refresh subscription details"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="space-y-8 animate-pulse">
          <div className="h-48 bg-white border border-gray-200 rounded-2xl p-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-white border border-gray-200 rounded-2xl p-6" />
            <div className="h-32 bg-white border border-gray-200 rounded-2xl p-6" />
            <div className="h-32 bg-white border border-gray-200 rounded-2xl p-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-80 bg-white border border-gray-200 rounded-2xl p-6" />
            <div className="h-80 bg-white border border-gray-200 rounded-2xl p-6" />
            <div className="h-80 bg-white border border-gray-200 rounded-2xl p-6" />
          </div>
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-rose-800">Failed to load subscription details</h3>
            <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchSubscriptionData}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      )}

      {!loading && !error && currentPlan && usage && (
        <>
          {/* SECTION 1: Current Plan Card */}
          <section aria-labelledby="current-plan-heading">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Current Plan
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Active
                    </span>
                  </div>

                  <h2 id="current-plan-heading" className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {currentPlan.subscriptionName}
                  </h2>
                  <p className="text-sm text-gray-600 max-w-xl leading-relaxed">
                    {currentPlan.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">
                        ₹{currentPlan.price}
                      </span>
                      <span className="text-sm font-medium text-gray-500">/month</span>
                    </div>
                    {currentPlan.price > 0 ? (
                      <p className="text-xs text-gray-500 mt-1">Recurring monthly subscription</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Standard free tier • No renewal charge</p>
                    )}
                  </div>

                  {isHighestPlan ? (
                    <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 cursor-default">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>You&apos;re on the highest plan</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const nextPlan = availablePlans.find((p) => p.price > currentPlan.price);
                        if (nextPlan) {
                          setSelectedPlan(nextPlan);
                        } else {
                          const compareSection = document.getElementById("compare-plans-section");
                          compareSection?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <span>Upgrade Plan</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Meta Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-6 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>
                    Organization: <strong className="text-gray-900 font-semibold">{data.organization.companyName}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    Member since: <strong className="text-gray-900 font-semibold">{formattedStartDate}</strong>
                  </span>
                </div>

                {currentPlan.price > 0 && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span>
                      Billing Interval: <strong className="text-gray-900 font-semibold">Monthly (Stripe)</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 2: Usage vs Limits */}
          <section aria-labelledby="usage-limits-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="usage-limits-heading" className="text-base font-bold text-gray-900">
                  Usage & Plan Capacity
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Real-time organization resources tracked against your current plan limits.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Workspaces limit card */}
              <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Workspaces</h3>
                      <p className="text-[11px] text-gray-400">Total active workspaces</p>
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-xs ${getTextColor(usage.workspaces.percent, usage.workspaces.status)}`}>
                    {usage.workspaces.current} of {usage.workspaces.limit ?? "∞"} used
                  </span>
                </div>

                <div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      role="progressbar"
                      aria-valuenow={usage.workspaces.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Workspace usage"
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(
                        usage.workspaces.percent,
                        usage.workspaces.status
                      )}`}
                      style={{ width: `${Math.max(4, Math.min(100, usage.workspaces.percent))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                    <span>{usage.workspaces.percent}% utilized</span>
                    {usage.workspaces.status === "exceeded" && (
                      <span className="text-rose-600 font-semibold">Limit reached</span>
                    )}
                    {usage.workspaces.status === "warning" && (
                      <span className="text-amber-600 font-semibold">Approaching limit</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rooms limit card */}
              <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                      <DoorOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Rooms</h3>
                      <p className="text-[11px] text-gray-400">Total audio & chat rooms</p>
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-xs ${getTextColor(usage.rooms.percent, usage.rooms.status)}`}>
                    {usage.rooms.current} of {usage.rooms.limit ?? "∞"} used
                  </span>
                </div>

                <div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      role="progressbar"
                      aria-valuenow={usage.rooms.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Room usage"
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(
                        usage.rooms.percent,
                        usage.rooms.status
                      )}`}
                      style={{ width: `${Math.max(4, Math.min(100, usage.rooms.percent))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                    <span>{usage.rooms.percent}% utilized</span>
                    {usage.rooms.status === "exceeded" && (
                      <span className="text-rose-600 font-semibold">Limit reached</span>
                    )}
                    {usage.rooms.status === "warning" && (
                      <span className="text-amber-600 font-semibold">Approaching limit</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Members limit card */}
              <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <UsersIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Members</h3>
                      <p className="text-[11px] text-gray-400">Organization roster</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-emerald-600">
                    {usage.members.current} active
                  </span>
                </div>

                <div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      role="progressbar"
                      aria-valuenow={15}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Members limit"
                      className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: "25%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                    <span className="text-emerald-700 font-medium">Unlimited members tier</span>
                    <span className="text-gray-400">No cap</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: Compare Plans */}
          <section id="compare-plans-section" aria-labelledby="compare-plans-heading" className="space-y-4 pt-2">
            <div>
              <h2 id="compare-plans-heading" className="text-base font-bold text-gray-900">
                Compare All Available Plans
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Transparent pricing and structured limits from the system catalog.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePlans.map((plan) => {
                const isCurrent =
                  plan._id === currentPlan._id ||
                  (currentPlan._id === "free" && plan.price === 0);
                const isUpgrade = plan.price > currentPlan.price;
                const isDowngrade = plan.price < currentPlan.price;
                const cleanedFeatures = cleanPlanFeatures(plan.features);

                return (
                  <div
                    key={plan._id}
                    className={`rounded-2xl bg-white border p-6 flex flex-col justify-between transition-all duration-200 relative ${
                      isCurrent
                        ? "border-indigo-500 shadow-md ring-1 ring-indigo-500"
                        : "border-gray-200/90 shadow-xs hover:border-gray-300"
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                          <Check className="w-3 h-3" />
                          Current Plan
                        </span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">{plan.subscriptionName}</h3>
                        {plan.price === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                            Free
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 min-h-[32px] line-clamp-2">
                        {plan.description}
                      </p>

                      <div className="pt-2 pb-4 border-b border-gray-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
                          <span className="text-xs font-medium text-gray-400">/month</span>
                        </div>
                      </div>

                      {/* Explicit Single-Sourced Limits */}
                      <div className="space-y-2.5 pt-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Resource Limits
                        </p>

                        <div className="space-y-2 text-xs text-gray-700">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <Check className="h-3 w-3 stroke-[2.5]" />
                            </span>
                            <span>
                              Up to <strong className="text-gray-900 font-semibold">{plan.maxWorkspaces}</strong> workspaces
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <Check className="h-3 w-3 stroke-[2.5]" />
                            </span>
                            <span>
                              Up to <strong className="text-gray-900 font-semibold">{plan.maxRooms ?? 10}</strong> rooms per workspace
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <Check className="h-3 w-3 stroke-[2.5]" />
                            </span>
                            <span>
                              <strong className="text-gray-900 font-semibold">Unlimited</strong> team members
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cleaned Features List */}
                      {cleanedFeatures.length > 0 && (
                        <div className="space-y-2.5 pt-3 border-t border-gray-100">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Included Capabilities
                          </p>
                          <ul className="space-y-2 text-xs text-gray-600">
                            {cleanedFeatures.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                  <Check className="h-3 w-3 stroke-[2.5]" />
                                </span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="pt-6 mt-6 border-t border-gray-100">
                      {isCurrent ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed text-center"
                        >
                          Current Plan
                        </button>
                      ) : isUpgrade ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(plan)}
                          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <span>Upgrade to {plan.subscriptionName}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      ) : isDowngrade ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(plan)}
                          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                          <span>Downgrade to {plan.subscriptionName}</span>
                          <ArrowDownRight className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(plan)}
                          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
                        >
                          Switch Plan
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* SECTION 4: Upgrade / Downgrade Confirm Modal */}
      {selectedPlan && currentPlan && usage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-change-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${selectedPlan.price > currentPlan.price ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"}`}>
                  {selectedPlan.price > currentPlan.price ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 id="plan-change-dialog-title" className="text-base font-bold text-gray-900">
                    {selectedPlan.price > currentPlan.price ? "Upgrade Subscription" : "Downgrade Subscription"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Review capacity changes for {data?.organization?.companyName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(null);
                  setActionError(null);
                }}
                disabled={isProcessingUpgrade}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plan Comparison Summary Box */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-200/70 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Plan</span>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{currentPlan.subscriptionName}</p>
                <p className="font-semibold text-gray-600">₹{currentPlan.price}/month</p>
                <p className="text-[11px] text-gray-500 mt-2">
                  Limit: {currentPlan.maxWorkspaces} workspaces
                </p>
              </div>

              <div className="border-l border-gray-200 pl-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Target Plan</span>
                <p className="text-sm font-bold text-indigo-700 mt-0.5">{selectedPlan.subscriptionName}</p>
                <p className="font-semibold text-indigo-900">₹{selectedPlan.price}/month</p>
                <p className="text-[11px] text-indigo-800 mt-2">
                  Limit: {selectedPlan.maxWorkspaces} workspaces
                </p>
              </div>
            </div>

            {/* Resource Capacity Changes */}
            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Resource Allocation Changes
              </span>

              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 px-3.5 py-1">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-600">Workspace Capacity</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {currentPlan.maxWorkspaces} &rarr; {selectedPlan.maxWorkspaces}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-600">Rooms per Workspace</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {currentPlan.maxRooms ?? 10} &rarr; {selectedPlan.maxRooms ?? 10}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-600">Team Members</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    Unlimited
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-600">Billing Interval</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {selectedPlan.price === 0 ? "Free tier" : "Monthly via Stripe"}
                  </span>
                </div>
              </div>
            </div>

            {/* Downgrade Blocker Alert */}
            {downgradeBlockReason && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Downgrade Blocked</p>
                  <p className="leading-relaxed">{downgradeBlockReason}</p>
                </div>
              </div>
            )}

            {/* General Action Error */}
            {actionError && !downgradeBlockReason && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(null);
                  setActionError(null);
                }}
                disabled={isProcessingUpgrade}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmPlanChange}
                disabled={isProcessingUpgrade || Boolean(downgradeBlockReason)}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedPlan.price > currentPlan.price
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isProcessingUpgrade
                  ? "Processing..."
                  : selectedPlan.price === 0
                  ? "Confirm Free Plan"
                  : selectedPlan.price > currentPlan.price
                  ? "Proceed to Stripe Checkout"
                  : "Confirm Downgrade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
