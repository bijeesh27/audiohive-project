import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Archive,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Building2,
  Layers,
  MoreVertical,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Eye,
  Star,
  Users,
  MoveUp,
  MoveDown,
  Loader2,
  Info,
} from "lucide-react";
import {
  getSuperAdminPlans,
  createSuperAdminPlan,
  updateSuperAdminPlan,
  updateSuperAdminPlanStatus,
  setDefaultSuperAdminPlan,
  deleteSuperAdminPlan,
  checkPlanImpact,
  getSuperAdminSubscriptions,
  changeSuperAdminSubscriptionPlan,
} from "../../services/superAdminServices";
import type {
  ISuperAdminPlan,
  ISuperAdminSubscriptionItem,
  IPlanImpactResult,
} from "../../services/superAdminServices";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

interface PlanFormData {
  subscriptionName: string;
  key: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  description: string;
  maxWorkspaces: number;
  maxRooms: number;
  customFeatures: string[];
  isDefault: boolean;
  isRecommended: boolean;
  displayOrder: number;
  status: "active" | "inactive" | "archived";
}

const defaultFormData: PlanFormData = {
  subscriptionName: "",
  key: "",
  price: 0,
  currency: "INR",
  interval: "month",
  description: "",
  maxWorkspaces: 1,
  maxRooms: 10,
  customFeatures: [],
  isDefault: false,
  isRecommended: false,
  displayOrder: 1,
  status: "active",
};

// Extracts custom features by removing auto-generated limit lines
const extractCustomFeatures = (features: string[] = []): string[] => {
  return features.filter((f) => {
    const trimmed = f.trim();
    if (/^(?:up\s+to\s+)?\d+\s*workspaces?$/i.test(trimmed)) return false;
    if (/^(?:up\s+to\s+)?\d+\s*rooms?(?:\s+per\s+workspace)?$/i.test(trimmed)) return false;
    return true;
  });
};

export const SubscriptionPlan: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'plans' | 'subscriptions'
  const activeTab = (searchParams.get("tab") as "plans" | "subscriptions") || "plans";

  // Filter params for subscriptions tab
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const searchParam = searchParams.get("search") || "";
  const planFilterParam = searchParams.get("planId") || "all";
  const statusFilterParam = searchParams.get("status") || "all";
  const nearLimitParam = searchParams.get("nearLimit") === "true";
  const sortParam = (searchParams.get("sort") as "newest" | "oldest" | "name" | "workspaces") || "newest";

  // Plans Tab Data & State
  const [plans, setPlans] = useState<ISuperAdminPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState<boolean>(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Subscriptions Tab Data & State
  const [subscriptions, setSubscriptions] = useState<ISuperAdminSubscriptionItem[]>([]);
  const [subTotal, setSubTotal] = useState<number>(0);
  const [subTotalPages, setSubTotalPages] = useState<number>(1);
  const [subPageSize, setSubPageSize] = useState<number>(10);
  const [subLoading, setSubLoading] = useState<boolean>(false);
  const [subError, setSubError] = useState<string | null>(null);

  // Debounced search for subscriptions
  const [searchInput, setSearchInput] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);

  // Filter Options for Subscriptions tab
  const [filterPlans, setFilterPlans] = useState<Array<{ _id: string; subscriptionName: string; price: number }>>([]);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keep search param in sync for subscriptions tab
  useEffect(() => {
    if (activeTab === "subscriptions") {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (debouncedSearch) {
            next.set("search", debouncedSearch);
          } else {
            next.delete("search");
          }
          next.set("page", "1");
          return next;
        },
        { replace: true }
      );
    }
  }, [debouncedSearch, activeTab, setSearchParams]);

  // --- Plan Editor (Drawer / Modal) State ---
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<ISuperAdminPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
  const [newFeatureInput, setNewFeatureInput] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editorSaving, setEditorSaving] = useState<boolean>(false);

  // Live Plan Impact State
  const [impactCheck, setImpactCheck] = useState<IPlanImpactResult | null>(null);
  const [checkingImpact, setCheckingImpact] = useState<boolean>(false);

  // Action Menu state on Plan Card
  const [openPlanMenuId, setOpenPlanMenuId] = useState<string | null>(null);
  const planMenuRef = useRef<HTMLDivElement | null>(null);

  // Action Menu state on Subscription Row
  const [openSubMenuId, setOpenSubMenuId] = useState<string | null>(null);
  const subMenuRef = useRef<HTMLDivElement | null>(null);

  // Confirm Dialog states
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState<ISuperAdminPlan | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Change Organization Plan Modal
  const [changePlanOrg, setChangePlanOrg] = useState<ISuperAdminSubscriptionItem | null>(null);
  const [selectedTargetPlanId, setSelectedTargetPlanId] = useState<string>("");
  const [changingPlan, setChangingPlan] = useState<boolean>(false);

  // Close menus on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-plan-menu]")) {
        setOpenPlanMenuId(null);
      }
      if (!target.closest("[data-sub-menu]")) {
        setOpenSubMenuId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenPlanMenuId(null);
        setOpenSubMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Switch tabs
  const handleTabChange = (tab: "plans" | "subscriptions", planFilter?: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        if (planFilter) {
          next.set("planId", planFilter);
        }
        next.set("page", "1");
        return next;
      },
      { replace: true }
    );
  };

  // Helper to update query params
  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value || value === "all") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
          next.set("page", "1");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Fetch Plans
  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      setPlansError(null);
      const res = await getSuperAdminPlans();
      if (res.data) {
        setPlans(res.data);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setPlansError(errorObj?.response?.data?.message || "Failed to load subscription plans.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Fetch Subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      setSubLoading(true);
      setSubError(null);
      const res = await getSuperAdminSubscriptions({
        page: pageParam,
        limit: subPageSize,
        search: debouncedSearch || undefined,
        planId: planFilterParam !== "all" ? planFilterParam : undefined,
        status: statusFilterParam !== "all" ? statusFilterParam : undefined,
        nearLimit: nearLimitParam,
        sort: sortParam,
      });

      if (res.data) {
        setSubscriptions(res.data.subscriptions);
        setSubTotal(res.data.total);
        setSubTotalPages(res.data.totalPages);
        if (res.data.filterOptions?.plans) {
          setFilterPlans(res.data.filterOptions.plans);
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSubError(errorObj?.response?.data?.message || "Failed to load organization subscriptions.");
    } finally {
      setSubLoading(false);
    }
  }, [pageParam, subPageSize, debouncedSearch, planFilterParam, statusFilterParam, nearLimitParam, sortParam]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (activeTab === "subscriptions") {
      fetchSubscriptions();
    }
  }, [activeTab, fetchSubscriptions]);

  // Open Add Plan Modal
  const handleOpenAddPlan = () => {
    setEditingPlan(null);
    setFormData({
      ...defaultFormData,
      displayOrder: plans.length + 1,
    });
    setFormErrors({});
    setImpactCheck(null);
    setEditorOpen(true);
  };

  // Open Edit Plan Modal
  const handleOpenEditPlan = (plan: ISuperAdminPlan) => {
    setEditingPlan(plan);
    setFormData({
      subscriptionName: plan.subscriptionName,
      key: plan.key,
      price: plan.price,
      currency: plan.currency || "INR",
      interval: plan.interval || "month",
      description: plan.description,
      maxWorkspaces: plan.maxWorkspaces,
      maxRooms: plan.maxRooms ?? 10,
      customFeatures: extractCustomFeatures(plan.features),
      isDefault: plan.isDefault,
      isRecommended: plan.isRecommended,
      displayOrder: plan.displayOrder,
      status: plan.status,
    });
    setFormErrors({});
    setImpactCheck(null);
    setEditorOpen(true);
  };

  // Live impact verification when maxWorkspaces is reduced on an existing plan
  useEffect(() => {
    if (!editorOpen || !editingPlan || editingPlan.subscriberCount === 0) {
      setImpactCheck(null);
      return;
    }

    if (formData.maxWorkspaces < editingPlan.maxWorkspaces) {
      let cancelled = false;
      const timer = setTimeout(async () => {
        try {
          setCheckingImpact(true);
          const res = await checkPlanImpact(editingPlan._id, formData.maxWorkspaces);
          if (!cancelled && res.data) {
            setImpactCheck(res.data);
          }
        } catch {
          // ignore check error
        } finally {
          if (!cancelled) setCheckingImpact(false);
        }
      }, 400);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    } else {
      setImpactCheck(null);
    }
  }, [editorOpen, editingPlan, formData.maxWorkspaces]);

  // Custom feature management
  const handleAddFeature = () => {
    const trimmed = newFeatureInput.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      customFeatures: [...prev.customFeatures, trimmed],
    }));
    setNewFeatureInput("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      customFeatures: prev.customFeatures.filter((_, i) => i !== idx),
    }));
  };

  const handleMoveFeature = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= formData.customFeatures.length) return;
    const next = [...formData.customFeatures];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setFormData((prev) => ({ ...prev, customFeatures: next }));
  };

  // Form Submission for Create or Edit
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.subscriptionName.trim()) {
      errors.subscriptionName = "Plan name is required";
    }
    if (!formData.key.trim()) {
      errors.key = "Unique plan key is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.key.trim().toLowerCase())) {
      errors.key = "Key must contain only lowercase letters, numbers, and hyphens";
    }
    if (formData.price < 0) {
      errors.price = "Price cannot be negative";
    }
    if (formData.maxWorkspaces < 1) {
      errors.maxWorkspaces = "Maximum workspaces must be at least 1";
    }
    if (formData.maxRooms < 1) {
      errors.maxRooms = "Maximum rooms must be at least 1";
    }

    if (impactCheck && !impactCheck.canSave) {
      errors.maxWorkspaces =
        impactCheck.warningMessage || "Cannot save: existing subscribers exceed this limit.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Auto-generate limit bullets combined with custom features
    const generatedLimits = [
      `Up to ${formData.maxWorkspaces} ${formData.maxWorkspaces === 1 ? "workspace" : "workspaces"}`,
      `Up to ${formData.maxRooms} rooms per workspace`,
    ];
    const fullFeatures = [...generatedLimits, ...formData.customFeatures];

    try {
      setEditorSaving(true);

      const payload = {
        subscriptionName: formData.subscriptionName.trim(),
        key: formData.key.trim().toLowerCase(),
        price: Number(formData.price),
        currency: formData.currency,
        interval: formData.interval,
        description: formData.description.trim(),
        maxWorkspaces: Number(formData.maxWorkspaces),
        maxRooms: Number(formData.maxRooms),
        features: fullFeatures,
        isDefault: formData.isDefault,
        isRecommended: formData.isRecommended,
        displayOrder: Number(formData.displayOrder),
        status: formData.status,
        isActive: formData.status === "active",
      };

      if (editingPlan) {
        await updateSuperAdminPlan(editingPlan._id, payload);
        setToastMessage({
          type: "success",
          text: `Plan "${payload.subscriptionName}" updated successfully.`,
        });
      } else {
        await createSuperAdminPlan(payload);
        setToastMessage({
          type: "success",
          text: `Plan "${payload.subscriptionName}" created successfully.`,
        });
      }

      setEditorOpen(false);
      fetchPlans();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setFormErrors({
        form: errorObj?.response?.data?.message || "Failed to save plan. Please try again.",
      });
    } finally {
      setEditorSaving(false);
    }
  };

  // Status toggle handler
  const handleToggleStatus = async (plan: ISuperAdminPlan) => {
    const nextStatus = plan.status === "active" ? "inactive" : "active";
    try {
      setActionLoading(true);
      await updateSuperAdminPlanStatus(plan._id, nextStatus);
      setToastMessage({
        type: "success",
        text: `Plan "${plan.subscriptionName}" is now ${nextStatus}.`,
      });
      fetchPlans();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text: errorObj?.response?.data?.message || "Failed to update plan status.",
      });
    } finally {
      setActionLoading(false);
      setOpenPlanMenuId(null);
    }
  };

  // Archive handler
  const handleArchivePlan = async (plan: ISuperAdminPlan) => {
    try {
      setActionLoading(true);
      await updateSuperAdminPlanStatus(plan._id, "archived");
      setToastMessage({
        type: "success",
        text: `Plan "${plan.subscriptionName}" has been archived.`,
      });
      fetchPlans();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text: errorObj?.response?.data?.message || "Failed to archive plan.",
      });
    } finally {
      setActionLoading(false);
      setOpenPlanMenuId(null);
    }
  };

  // Set Default Plan handler
  const handleSetDefault = async (plan: ISuperAdminPlan) => {
    try {
      setActionLoading(true);
      await setDefaultSuperAdminPlan(plan._id);
      setToastMessage({
        type: "success",
        text: `Plan "${plan.subscriptionName}" is now the default plan for new organizations.`,
      });
      fetchPlans();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text: errorObj?.response?.data?.message || "Failed to set default plan.",
      });
    } finally {
      setActionLoading(false);
      setOpenPlanMenuId(null);
    }
  };

  // Delete Plan handler
  const handleConfirmDelete = async () => {
    if (!deleteConfirmPlan) return;
    try {
      setActionLoading(true);
      await deleteSuperAdminPlan(deleteConfirmPlan._id);
      setToastMessage({
        type: "success",
        text: `Plan "${deleteConfirmPlan.subscriptionName}" has been permanently deleted.`,
      });
      setDeleteConfirmPlan(null);
      fetchPlans();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text: errorObj?.response?.data?.message || "Failed to delete plan.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Change Subscription Plan handler
  const handleConfirmChangeSubscriptionPlan = async () => {
    if (!changePlanOrg || !selectedTargetPlanId) return;
    try {
      setChangingPlan(true);
      await changeSuperAdminSubscriptionPlan(changePlanOrg.organizationId, selectedTargetPlanId);
      setToastMessage({
        type: "success",
        text: `Switched ${changePlanOrg.companyName} to selected plan.`,
      });
      setChangePlanOrg(null);
      fetchSubscriptions();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text: errorObj?.response?.data?.message || "Failed to change organization plan.",
      });
    } finally {
      setChangingPlan(false);
    }
  };

  // Auto-generate live features preview
  const previewFeatures = useMemo(() => {
    const limits = [
      `Up to ${formData.maxWorkspaces || 1} ${formData.maxWorkspaces === 1 ? "workspace" : "workspaces"}`,
      `Up to ${formData.maxRooms || 10} rooms per workspace`,
    ];
    return [...limits, ...formData.customFeatures];
  }, [formData.maxWorkspaces, formData.maxRooms, formData.customFeatures]);

  // Selected target plan details for Change Plan Modal
  const targetPlanDetails = useMemo(() => {
    if (!selectedTargetPlanId) return null;
    return plans.find((p) => p._id === selectedTargetPlanId) || null;
  }, [selectedTargetPlanId, plans]);

  const targetPlanCapacityExceeded = useMemo(() => {
    if (!changePlanOrg || !targetPlanDetails) return false;
    return changePlanOrg.workspacesCount > targetPlanDetails.maxWorkspaces;
  }, [changePlanOrg, targetPlanDetails]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200 text-sm font-medium ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Subscription Plans</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              <CreditCard className="w-3 h-3 text-indigo-600" />
              Platform
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Configure pricing tiers, workspace capacities, features, and monitor organization subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddPlan}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab === "plans") fetchPlans();
              else fetchSubscriptions();
            }}
            disabled={plansLoading || subLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            aria-label="Refresh data"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 text-gray-500 ${plansLoading || subLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Persistent Tabs: Plans / Subscriptions */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6" aria-label="Subscription Navigation Tabs">
          <button
            type="button"
            onClick={() => handleTabChange("plans")}
            className={`py-3 px-1 border-b-2 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "plans"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Plans ({plans.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("subscriptions")}
            className={`py-3 px-1 border-b-2 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "subscriptions"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Organization Subscriptions</span>
          </button>
        </nav>
      </div>

      {/* ─────────────────── TAB 1: PLANS ─────────────────── */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          {plansLoading ? (
            /* Loading Skeleton Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skeleton-plan-${i}`}
                  className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs animate-pulse space-y-4"
                >
                  <div className="h-6 w-32 bg-gray-200 rounded" />
                  <div className="h-8 w-24 bg-gray-200 rounded" />
                  <div className="space-y-2 pt-4">
                    <div className="h-4 w-full bg-gray-100 rounded" />
                    <div className="h-4 w-5/6 bg-gray-100 rounded" />
                    <div className="h-4 w-4/6 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : plansError ? (
            /* Error State */
            <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center max-w-md mx-auto space-y-3">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-base font-semibold text-gray-900">Failed to load plans</h3>
              <p className="text-xs sm:text-sm text-gray-500">{plansError}</p>
              <button
                type="button"
                onClick={fetchPlans}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          ) : (
            /* Plans Equal-Height Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan) => {
                const isDefault = plan.isDefault;
                const isRecommended = plan.isRecommended;
                const subscriberCount = plan.subscriberCount || 0;
                const canDelete = subscriberCount === 0 && !isDefault;

                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                );
                if (plan.status === "inactive") {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Inactive
                    </span>
                  );
                } else if (plan.status === "archived") {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Archive className="w-3 h-3 text-amber-600" />
                      Archived
                    </span>
                  );
                }

                // Clean custom features for display
                const customFeatures = extractCustomFeatures(plan.features);

                return (
                  <div
                    key={plan._id}
                    className={`flex flex-col bg-white rounded-2xl border transition-all duration-200 hover:shadow-md relative overflow-hidden ${
                      isRecommended
                        ? "border-indigo-400 ring-2 ring-indigo-500/10 shadow-xs"
                        : "border-gray-200/80 shadow-xs"
                    }`}
                  >
                    {/* Recommended Banner */}
                    {isRecommended && (
                      <div className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 text-center flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        Recommended Tier
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Header Row: Title, Badges & "..." Menu */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                                {plan.subscriptionName}
                              </h3>
                              {isDefault && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800"
                                  title="Assigned automatically to new organizations"
                                >
                                  Default
                                </span>
                              )}
                              {statusBadge}
                            </div>
                            <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                              key: {plan.key}
                            </span>
                          </div>

                          {/* "..." Action Dropdown Menu */}
                          <div className="relative" data-plan-menu>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenPlanMenuId(openPlanMenuId === plan._id ? null : plan._id)
                              }
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              aria-label={`Actions for ${plan.subscriptionName}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openPlanMenuId === plan._id && (
                              <div
                                ref={planMenuRef}
                                className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 z-30 divide-y divide-gray-100 text-left animate-in fade-in zoom-in-95 duration-100"
                              >
                                <div className="py-1">
                                  {/* Edit Plan */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenPlanMenuId(null);
                                      handleOpenEditPlan(plan);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-gray-500" />
                                    <span>Edit Plan</span>
                                  </button>

                                  {/* Set as Default */}
                                  {!plan.isDefault && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetDefault(plan)}
                                      disabled={plan.status !== "active" || actionLoading}
                                      className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                      <Star className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Set as Default</span>
                                    </button>
                                  )}

                                  {/* Toggle Active / Inactive */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(plan)}
                                    disabled={plan.isDefault || actionLoading}
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title={plan.isDefault ? "The default plan cannot be deactivated" : undefined}
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{plan.status === "active" ? "Deactivate" : "Activate"}</span>
                                  </button>

                                  {/* Archive */}
                                  {plan.status !== "archived" && !plan.isDefault && (
                                    <button
                                      type="button"
                                      onClick={() => handleArchivePlan(plan)}
                                      disabled={actionLoading}
                                      className="w-full text-left px-4 py-2 text-xs sm:text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Archive className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Archive Plan</span>
                                    </button>
                                  )}
                                </div>

                                <div className="py-1">
                                  {/* Delete Plan */}
                                  {canDelete ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenPlanMenuId(null);
                                        setDeleteConfirmPlan(plan);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                      <span>Delete Plan</span>
                                    </button>
                                  ) : (
                                    <div
                                      className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-400 flex items-center gap-2.5 cursor-not-allowed opacity-60"
                                      title={
                                        isDefault
                                          ? "Default plan cannot be deleted"
                                          : `${subscriberCount} organization(s) are subscribed to this plan`
                                      }
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                                      <span>Delete Plan</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-500 leading-relaxed mb-4 min-h-[36px]">
                          {plan.description || "No description provided."}
                        </p>

                        {/* Price */}
                        <div className="flex items-baseline gap-1.5 mb-5 pb-5 border-b border-gray-100">
                          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {plan.price === 0 ? "Free" : `₹${plan.price}`}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-xs font-medium text-gray-500">
                              / {plan.interval || "month"}
                            </span>
                          )}
                        </div>

                        {/* Enforced Limits Row */}
                        <div className="space-y-2 mb-5 pb-5 border-b border-gray-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              Maximum Workspaces
                            </span>
                            <span className="font-bold text-gray-900">{plan.maxWorkspaces}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-gray-400" />
                              Rooms per Workspace
                            </span>
                            <span className="font-bold text-gray-900">{plan.maxRooms ?? 10}</span>
                          </div>
                        </div>

                        {/* Dynamic Limit Bullets & Features */}
                        <div className="space-y-2 mb-6">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Included Capabilities
                          </p>
                          <ul className="space-y-2 text-xs text-gray-600">
                            <li className="flex items-center gap-2 font-medium text-gray-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>
                                Up to <strong>{plan.maxWorkspaces}</strong> {plan.maxWorkspaces === 1 ? "workspace" : "workspaces"}
                              </span>
                            </li>
                            <li className="flex items-center gap-2 font-medium text-gray-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>
                                Up to <strong>{plan.maxRooms ?? 10}</strong> rooms per workspace
                              </span>
                            </li>
                            {customFeatures.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Footer: Subscriber Count Pill & Edit Button */}
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleTabChange("subscriptions", plan._id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="View subscriber organizations"
                        >
                          <Users className="w-3.5 h-3.5 text-gray-500" />
                          <span>
                            {subscriberCount} {subscriberCount === 1 ? "organization" : "organizations"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditPlan(plan)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────── TAB 2: SUBSCRIPTIONS ─────────────────── */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          {/* Subscriptions Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search organization or owner..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                  aria-label="Search subscriptions"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Plan Filter */}
                <select
                  value={planFilterParam}
                  onChange={(e) => updateQueryParam("planId", e.target.value)}
                  className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  aria-label="Filter by plan"
                >
                  <option value="all">All Plans</option>
                  {filterPlans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.subscriptionName}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilterParam}
                  onChange={(e) => updateQueryParam("status", e.target.value)}
                  className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>

                {/* Near Limit Toggle Pill */}
                <button
                  type="button"
                  onClick={() => updateQueryParam("nearLimit", nearLimitParam ? "false" : "true")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    nearLimitParam
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                  aria-label="Filter organizations near plan capacity limit"
                >
                  <AlertTriangle
                    className={`w-3.5 h-3.5 ${nearLimitParam ? "text-amber-600" : "text-gray-400"}`}
                  />
                  Near Limit (80%+)
                </button>

                {/* Sort */}
                <select
                  value={sortParam}
                  onChange={(e) => updateQueryParam("sort", e.target.value)}
                  className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  aria-label="Sort subscriptions"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="name">Sort: Name</option>
                  <option value="workspaces">Sort: Most workspaces</option>
                </select>

                {/* Page Size */}
                <select
                  value={subPageSize}
                  onChange={(e) => {
                    setSubPageSize(Number(e.target.value));
                    setSearchParams(
                      (prev) => {
                        const next = new URLSearchParams(prev);
                        next.set("page", "1");
                        return next;
                      },
                      { replace: true }
                    );
                  }}
                  className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  aria-label="Items per page"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/80 bg-gray-50/75 text-gray-600 font-semibold">
                    <th scope="col" className="py-3.5 pl-6 pr-4">
                      Organization
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Plan
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Status
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Started
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Workspace Usage
                    </th>
                    <th scope="col" className="py-3.5 pl-4 pr-6 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {subLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`sub-skel-${i}`} className="animate-pulse">
                        <td className="py-4 pl-6 pr-4">
                          <div className="h-5 w-32 bg-gray-200 rounded" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 w-20 bg-gray-200 rounded-full" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 w-16 bg-gray-200 rounded-full" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 w-28 bg-gray-200 rounded" />
                        </td>
                        <td className="py-4 pl-4 pr-6 text-right">
                          <div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : subError ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="max-w-sm mx-auto space-y-3">
                          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                          <h3 className="text-base font-semibold text-gray-900">
                            Failed to load subscriptions
                          </h3>
                          <p className="text-xs text-gray-500">{subError}</p>
                          <button
                            type="button"
                            onClick={fetchSubscriptions}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="max-w-sm mx-auto space-y-3">
                          <CreditCard className="w-12 h-12 text-gray-300 mx-auto" />
                          <h3 className="text-base font-semibold text-gray-900">
                            No subscriptions found
                          </h3>
                          <p className="text-xs text-gray-500">
                            {debouncedSearch || planFilterParam !== "all" || nearLimitParam
                              ? "Try adjusting or clearing your filters."
                              : "No organization subscriptions exist on the platform."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const isFree = sub.plan.price === 0;

                      return (
                        <tr
                          key={sub.organizationId}
                          className="group hover:bg-indigo-50/20 transition-colors"
                        >
                          {/* Organization */}
                          <td className="py-3.5 pl-6 pr-4">
                            <Link
                              to={`/superadmin/organizations/${sub.organizationId}`}
                              className="group-hover:text-indigo-600 transition-colors"
                            >
                              <span className="font-semibold text-gray-900 block truncate max-w-[200px]">
                                {sub.companyName}
                              </span>
                              <span className="text-xs text-gray-400 block truncate">
                                {sub.ownerEmail}
                              </span>
                            </Link>
                          </td>

                          {/* Plan Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                isFree
                                  ? "bg-gray-100 text-gray-700 border-gray-200"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}
                            >
                              {sub.plan.subscriptionName}
                              {!isFree && <span className="text-[10px] opacity-75">(₹{sub.plan.price})</span>}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                                sub.orgStatus === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  sub.orgStatus === "active" ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                              />
                              {sub.orgStatus.charAt(0).toUpperCase() + sub.orgStatus.slice(1)}
                            </span>
                          </td>

                          {/* Started Date */}
                          <td className="py-3.5 px-4 text-xs text-gray-500">
                            <span title={new Date(sub.startedAt).toLocaleString()}>
                              {new Date(sub.startedAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </td>

                          {/* Workspace Usage */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1 max-w-[160px]">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-900">
                                  {sub.workspacesCount} of {sub.plan.maxWorkspaces}
                                </span>
                                <span
                                  className={`text-[11px] font-bold ${
                                    sub.nearLimit ? "text-amber-600" : "text-gray-500"
                                  }`}
                                >
                                  {sub.usagePercent}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    sub.workspacesCount >= sub.plan.maxWorkspaces
                                      ? "bg-red-500"
                                      : sub.nearLimit
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.max(4, Math.min(100, sub.usagePercent))}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Actions ("...") Menu */}
                          <td className="py-3.5 pl-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block text-left" data-sub-menu>
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenSubMenuId(
                                    openSubMenuId === sub.organizationId ? null : sub.organizationId
                                  )
                                }
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                aria-label={`Actions for ${sub.companyName}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openSubMenuId === sub.organizationId && (
                                <div
                                  ref={subMenuRef}
                                  className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 z-30 divide-y divide-gray-100 text-left animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <div className="py-1">
                                    <Link
                                      to={`/superadmin/organizations/${sub.organizationId}`}
                                      className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                                      <span>View Organization</span>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenSubMenuId(null);
                                        setChangePlanOrg(sub);
                                        setSelectedTargetPlanId(sub.plan._id);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs sm:text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Change Plan</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Single Subscriptions Pagination Footer */}
            {!subError && subTotalPages > 1 && (
              <div className="border-t border-gray-200/80 px-6 py-4 flex items-center justify-between bg-white">
                <p className="text-xs sm:text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {(pageParam - 1) * subPageSize + 1}
                  </span>
                  -
                  <span className="font-semibold text-gray-900">
                    {Math.min(pageParam * subPageSize, subTotal)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-900">{subTotal}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSearchParams(
                        (prev) => {
                          const next = new URLSearchParams(prev);
                          next.set("page", String(Math.max(1, pageParam - 1)));
                          return next;
                        },
                        { replace: true }
                      )
                    }
                    disabled={pageParam <= 1 || subLoading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSearchParams(
                        (prev) => {
                          const next = new URLSearchParams(prev);
                          next.set("page", String(Math.min(subTotalPages, pageParam + 1)));
                          return next;
                        },
                        { replace: true }
                      )
                    }
                    disabled={pageParam >= subTotalPages || subLoading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────── PLAN EDITOR MODAL WITH LIVE PREVIEW ─────────────────── */}
      {editorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-editor-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => !editorSaving && setEditorOpen(false)}
        >
          <div
            className="w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 sm:p-8 scale-100 animate-in zoom-in-95 duration-150 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 id="plan-editor-title" className="text-xl font-bold text-gray-900 tracking-tight">
                  {editingPlan ? `Edit Plan: ${editingPlan.subscriptionName}` : "Create New Subscription Plan"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set tier limits, features, and pricing. Limit bullets are auto-generated to prevent contradictions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !editorSaving && setEditorOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subscriber Impact Warning Banner */}
            {editingPlan && editingPlan.subscriberCount > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Subscribers Active: {editingPlan.subscriberCount} organizations</span>
                </div>
                <p>
                  Any limit or capacity changes will apply to all existing subscribers. The unique plan key
                  is locked and cannot be changed.
                </p>
              </div>
            )}

            {/* General Form Error */}
            {formErrors.form && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formErrors.form}</span>
              </div>
            )}

            {/* Editor Body: Form on Left (2 cols), Live Preview on Right (1 col) */}
            <form onSubmit={handleSavePlan} className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-2 space-y-5">
                {/* Name & Key */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Plan Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.subscriptionName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          subscriptionName: name,
                          key: editingPlan ? prev.key : name.toLowerCase().replace(/\s+/g, "-"),
                        }));
                        if (formErrors.subscriptionName) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.subscriptionName;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. Starter, Pro, Enterprise"
                      className="w-full text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {formErrors.subscriptionName && (
                      <p className="text-[11px] text-red-500 mt-1">{formErrors.subscriptionName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Key (Slug) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.key}
                      disabled={Boolean(editingPlan && editingPlan.subscriberCount > 0)}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, key: e.target.value.toLowerCase() }));
                        if (formErrors.key) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.key;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. starter, pro"
                      className="w-full text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {formErrors.key && (
                      <p className="text-[11px] text-red-500 mt-1">{formErrors.key}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief summary of who this plan is intended for..."
                    className="w-full text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Price, Interval & Display Order */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, price: Math.max(0, Number(e.target.value)) }))
                      }
                      className="w-full text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {formErrors.price && (
                      <p className="text-[11px] text-red-500 mt-1">{formErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Interval</label>
                    <select
                      value={formData.interval}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, interval: e.target.value as "month" | "year" }))
                      }
                      className="w-full text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))
                      }
                      className="w-full text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Capacity Limits (maxWorkspaces & maxRooms) */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Plan Limits (Enforced System-wide)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Max Workspaces <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.maxWorkspaces}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            maxWorkspaces: Math.max(1, Number(e.target.value)),
                          }))
                        }
                        className="w-full text-xs sm:text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      {formErrors.maxWorkspaces && (
                        <p className="text-[11px] text-red-500 mt-1">{formErrors.maxWorkspaces}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Rooms per Workspace <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.maxRooms}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            maxRooms: Math.max(1, Number(e.target.value)),
                          }))
                        }
                        className="w-full text-xs sm:text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {checkingImpact && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking subscriber impact...</span>
                    </div>
                  )}

                  {impactCheck && !impactCheck.canSave && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                      <p className="font-semibold">{impactCheck.warningMessage}</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {impactCheck.affectedOrganizations.map((o) => (
                          <li key={o._id}>
                            <strong>{o.companyName}</strong> has {o.currentWorkspaces} workspaces (exceeds limit by{" "}
                            {o.exceededBy})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Features: Generated + Custom List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700">Custom Features</label>
                    <span className="text-[11px] text-gray-400">
                      Limit bullets are auto-generated below
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 24/7 Dedicated Support, Lossless Audio Streaming"
                      value={newFeatureInput}
                      onChange={(e) => setNewFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="flex-1 text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Reorderable Features List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {formData.customFeatures.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 text-xs"
                      >
                        <span className="text-gray-800 truncate pr-2">{feat}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveFeature(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                            aria-label="Move up"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFeature(idx, idx + 1)}
                            disabled={idx === formData.customFeatures.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                            aria-label="Move down"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                            aria-label="Remove feature"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flags: Default, Recommended, Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Default Signup Plan</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.isRecommended}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isRecommended: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Recommended Badge</span>
                  </label>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as "active" | "inactive" | "archived",
                        }))
                      }
                      className="w-full text-xs bg-gray-50/70 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 focus:bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Plan Card Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Live Owner Card Preview</span>
                </div>

                <div
                  className={`bg-white rounded-2xl border p-5 shadow-xs relative overflow-hidden transition-all ${
                    formData.isRecommended
                      ? "border-indigo-400 ring-2 ring-indigo-500/10"
                      : "border-gray-200"
                  }`}
                >
                  {formData.isRecommended && (
                    <div className="bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 text-center -mx-5 -mt-5 mb-4 flex items-center justify-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      Recommended Tier
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-base font-bold text-gray-900 truncate">
                      {formData.subscriptionName || "Plan Name"}
                    </h4>
                    {formData.isDefault && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-indigo-100 text-indigo-800 rounded">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 mb-3 min-h-[28px] line-clamp-2">
                    {formData.description || "Plan description preview..."}
                  </p>

                  <div className="flex items-baseline gap-1 mb-4 pb-3 border-b border-gray-100">
                    <span className="text-2xl font-extrabold text-gray-900">
                      {formData.price === 0 ? "Free" : `₹${formData.price}`}
                    </span>
                    {formData.price > 0 && (
                      <span className="text-[11px] text-gray-400">/{formData.interval}</span>
                    )}
                  </div>

                  <ul className="space-y-2 text-xs text-gray-600">
                    {previewFeatures.map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="lg:col-span-3 flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  disabled={editorSaving}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editorSaving || Boolean(impactCheck && !impactCheck.canSave)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {editorSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingPlan ? "Save Plan Changes" : "Create Plan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────── DELETE PLAN CONFIRM MODAL ─────────────────── */}
      {deleteConfirmPlan && (
        <ConfirmDialog
          isOpen={Boolean(deleteConfirmPlan)}
          title={`Delete plan "${deleteConfirmPlan.subscriptionName}"?`}
          message={
            <div className="space-y-2 text-xs sm:text-sm text-gray-600">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong className="text-gray-900">{deleteConfirmPlan.subscriptionName}</strong>?
              </p>
              <p className="text-red-600 text-xs">
                This action is irreversible. Plans with subscribers cannot be deleted and must be archived instead.
              </p>
            </div>
          }
          confirmLabel="Delete Plan"
          cancelLabel="Cancel"
          isDestructive={true}
          isLoading={actionLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmPlan(null)}
        />
      )}

      {/* ─────────────────── CHANGE ORGANIZATION PLAN MODAL ─────────────────── */}
      {changePlanOrg && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-plan-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !changingPlan && setChangePlanOrg(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 scale-100 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 id="change-plan-title" className="text-base font-bold text-gray-900">
                Change Subscription Plan
              </h3>
              <button
                type="button"
                onClick={() => !changingPlan && setChangePlanOrg(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-gray-600">
              <p>
                Select a new subscription tier for{" "}
                <strong className="text-gray-900">{changePlanOrg.companyName}</strong>:
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Subscription Plan
                </label>
                <select
                  value={selectedTargetPlanId}
                  onChange={(e) => setSelectedTargetPlanId(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:bg-white"
                >
                  {plans
                    .filter((p) => p.status === "active")
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.subscriptionName} (₹{p.price} / {p.interval || "month"}, max {p.maxWorkspaces} ws)
                      </option>
                    ))}
                </select>
              </div>

              {/* Usage Warning if Target Plan Limit is Exceeded */}
              {targetPlanCapacityExceeded && targetPlanDetails && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Capacity Limit Exceeded</span>
                  </div>
                  <p>
                    {changePlanOrg.companyName} currently has{" "}
                    <strong>{changePlanOrg.workspacesCount} active workspaces</strong>, but the{" "}
                    <strong>{targetPlanDetails.subscriptionName}</strong> plan only allows{" "}
                    <strong>{targetPlanDetails.maxWorkspaces}</strong>. Reduce workspaces first before switching.
                  </p>
                </div>
              )}

              {!targetPlanCapacityExceeded && targetPlanDetails && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Consequences of Plan Change</span>
                  </div>
                  <p>
                    The organization will be updated to the {targetPlanDetails.subscriptionName} plan limits
                    immediately. This action is recorded in the platform activity logs.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setChangePlanOrg(null)}
                disabled={changingPlan}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmChangeSubscriptionPlan}
                disabled={changingPlan || targetPlanCapacityExceeded || !selectedTargetPlanId}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {changingPlan && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirm Plan Change</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlan;
