import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  Search,
  MoreVertical,
  Edit2,
  CreditCard,
  PauseCircle,
  PlayCircle,
  Archive,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Layers,
  Users,
  Plus,
  X,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  getSuperAdminOrganizations,
  updateSuperAdminOrganizationStatus,
  updateSuperAdminOrganizationPlan,
  updateSuperAdminOrganizationDetails,
  deleteSuperAdminOrganization,
} from "../../services/superAdminServices";
import type {
  IEnrichedOrganization,
  ISuperAdminOrgListResponse,
} from "../../services/superAdminServices";
import { createOrganization } from "../../services/organizationServices";
import { API_ROUTES } from "../../constants/Api_Routes";
import { formatRelativeTime, formatAbsoluteTime } from "../../components/common/formatters";
import EmptyState from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

export default function Organization() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "10", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialPlan = searchParams.get("plan") || "all";
  const initialStatus = searchParams.get("status") || "all";
  const initialNearLimit = searchParams.get("nearLimit") === "true";
  const initialSort = (searchParams.get("sort") as "newest" | "oldest" | "name" | "members" | "lastActivity") || "newest";

  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialLimit);
  const [search, setSearch] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [planFilter, setPlanFilter] = useState<string>(initialPlan);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [nearLimitFilter, setNearLimitFilter] = useState<boolean>(initialNearLimit);
  const [sortField, setSortField] = useState<"newest" | "oldest" | "name" | "members" | "lastActivity">(initialSort);

  const [orgData, setOrgData] = useState<ISuperAdminOrgListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active Dropdown row ID
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Modals state
  const [statusModalOrg, setStatusModalOrg] = useState<{ org: IEnrichedOrganization; targetStatus: "active" | "suspended" | "archived" } | null>(null);
  const [deleteModalOrg, setDeleteModalOrg] = useState<IEnrichedOrganization | null>(null);
  const [deleteInputName, setDeleteInputName] = useState<string>("");
  const [changePlanModalOrg, setChangePlanModalOrg] = useState<IEnrichedOrganization | null>(null);
  const [selectedNewPlanId, setSelectedNewPlanId] = useState<string>("");
  const [editModalOrg, setEditModalOrg] = useState<IEnrichedOrganization | null>(null);
  const [editForm, setEditForm] = useState<{ companyName: string; slug: string; ownerName: string; ownerEmail: string }>({
    companyName: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
  });
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addForm, setAddForm] = useState<{ companyName: string; ownerName: string; ownerEmail: string }>({
    companyName: "",
    ownerName: "",
    ownerEmail: "",
  });
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  // Debounce search by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync state to URL Query Params
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("limit", String(pageSize));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (planFilter !== "all") params.set("plan", planFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (nearLimitFilter) params.set("nearLimit", "true");
    if (sortField !== "newest") params.set("sort", sortField);

    setSearchParams(params, { replace: true });
  }, [page, pageSize, debouncedSearch, planFilter, statusFilter, nearLimitFilter, sortField, setSearchParams]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Fetch Organizations
  const fetchOrganizations = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getSuperAdminOrganizations({
      page,
      limit: pageSize,
      search: debouncedSearch,
      plan: planFilter,
      status: statusFilter,
      nearLimit: nearLimitFilter,
      sort: sortField,
    })
      .then((res) => {
        if (!cancelled && res?.data) {
          setOrgData(res.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Failed to load organizations. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, debouncedSearch, planFilter, statusFilter, nearLimitFilter, sortField]);

  useEffect(() => {
    return fetchOrganizations();
  }, [fetchOrganizations]);

  // Close open dropdowns when clicking outside
  useEffect(() => {
    const handleClick = () => setActionMenuOpenId(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // --- Handlers ---

  const handleStatusChangeConfirm = async () => {
    if (!statusModalOrg) return;
    const { org, targetStatus } = statusModalOrg;
    setModalLoading(true);

    // Optimistic Update
    const previousOrgs = orgData?.organizations || [];
    setOrgData((prev) =>
      prev
        ? {
            ...prev,
            organizations: prev.organizations.map((o) =>
              o._id === org._id ? { ...o, status: targetStatus } : o
            ),
          }
        : null
    );

    try {
      await updateSuperAdminOrganizationStatus(org._id, targetStatus);
      setToastMessage({
        type: "success",
        text: `Organization ${org.companyName} set to ${targetStatus}.`,
      });
      setStatusModalOrg(null);
      fetchOrganizations();
    } catch (err: unknown) {
      // Rollback
      setOrgData((prev) => (prev ? { ...prev, organizations: previousOrgs } : null));
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text: errorObj?.response?.data?.message || "Failed to update organization status.",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalOrg) return;
    if (deleteInputName.trim() !== deleteModalOrg.companyName.trim()) {
      setToastMessage({ type: "error", text: "Organization name does not match." });
      return;
    }

    setModalLoading(true);
    try {
      await deleteSuperAdminOrganization(deleteModalOrg._id);
      setToastMessage({
        type: "success",
        text: `Organization ${deleteModalOrg.companyName} archived successfully.`,
      });
      setDeleteModalOrg(null);
      setDeleteInputName("");
      fetchOrganizations();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text: errorObj?.response?.data?.message || "Failed to delete organization.",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleChangePlanConfirm = async () => {
    if (!changePlanModalOrg || !selectedNewPlanId) return;
    setModalLoading(true);
    try {
      await updateSuperAdminOrganizationPlan(changePlanModalOrg._id, selectedNewPlanId);
      setToastMessage({
        type: "success",
        text: `Plan updated successfully for ${changePlanModalOrg.companyName}.`,
      });
      setChangePlanModalOrg(null);
      fetchOrganizations();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text: errorObj?.response?.data?.message || "Failed to change plan.",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalOrg) return;
    setModalLoading(true);
    try {
      await updateSuperAdminOrganizationDetails(editModalOrg._id, editForm);
      setToastMessage({
        type: "success",
        text: `Organization details updated for ${editForm.companyName}.`,
      });
      setEditModalOrg(null);
      fetchOrganizations();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text: errorObj?.response?.data?.message || "Failed to update details.",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await createOrganization(addForm);
      setToastMessage({
        type: "success",
        text: `Invitation sent to ${addForm.ownerEmail} for ${addForm.companyName}.`,
      });
      setShowAddModal(false);
      setAddForm({ companyName: "", ownerName: "", ownerEmail: "" });
      fetchOrganizations();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text: errorObj?.response?.data?.message || "Failed to create organization invitation.",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setPlanFilter("all");
    setStatusFilter("all");
    setNearLimitFilter(false);
    setSortField("newest");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      planFilter !== "all" ||
      statusFilter !== "all" ||
      nearLimitFilter ||
      sortField !== "newest"
  );

  const totalPages = Math.ceil((orgData?.total || 0) / pageSize) || 1;

  // Status Badge Component
  const renderStatusBadge = (status: IEnrichedOrganization["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Suspended
          </span>
        );
      case "archived":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Archived
          </span>
        );
    }
  };

  // Plan Badge Component (handles Unknown plan with warning)
  const renderPlanBadge = (org: IEnrichedOrganization) => {
    if (org.planMissing) {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300"
          title={`Referenced plan ID (${org.planId}) no longer exists in subscriptions`}
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Unknown plan
        </span>
      );
    }

    const isPro = org.planName.toLowerCase().includes("pro");
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
          isPro
            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
            : "bg-gray-50 text-gray-700 border-gray-200"
        }`}
      >
        <span>{org.planName}</span>
        {org.planPrice > 0 && <span className="text-[10px] text-gray-500 font-mono">${org.planPrice}</span>}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === "success"
              ? "bg-white text-emerald-800 border-emerald-200"
              : "bg-white text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Organizations
            </h1>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {orgData ? `${orgData.totalAll} total · ${orgData.activeCount} active` : "Loading..."}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Platform-wide organization management, workspace provisioning, and subscription tiers.
          </p>
        </div>

        {/* Add Organization Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Organization</span>
        </button>
      </div>

      {/* Controls Bar: Search, Filters, Sort */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by organization, slug, owner name or email..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <label htmlFor="status-filter" className="text-[11px] font-semibold text-gray-500">
                Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-gray-800"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Plan Filter */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <label htmlFor="plan-filter" className="text-[11px] font-semibold text-gray-500">
                Plan:
              </label>
              <select
                id="plan-filter"
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-gray-800"
              >
                <option value="all">All Plans</option>
                <option value="Free">Free</option>
                <option value="Pro">Pro</option>
              </select>
            </div>

            {/* Near Limit Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setNearLimitFilter((prev) => !prev);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                nearLimitFilter
                  ? "bg-amber-50 text-amber-800 border-amber-300 shadow-xs"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${nearLimitFilter ? "text-amber-600" : "text-gray-400"}`} />
              <span>Near Limit (80%+)</span>
            </button>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <label htmlFor="sort-select" className="text-[11px] font-semibold text-gray-500">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="text-xs bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-gray-800"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name (A-Z)</option>
                <option value="members">Most Members</option>
                <option value="lastActivity">Last Activity</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between text-xs text-rose-800"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchOrganizations}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Organizations Table Container (Page scrolls naturally, table horizontal scrolls on mobile only) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-xl" />
            ))}
          </div>
        ) : !orgData || orgData.organizations.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Building2}
              title={hasActiveFilters ? "No matching organizations found" : "No organizations registered"}
              description={
                hasActiveFilters
                  ? "Try adjusting your search criteria, clearing filters, or resetting the sort order."
                  : "Organizations provisioned on the platform will appear here."
              }
              actionLabel={hasActiveFilters ? "Clear All Filters" : "Add Organization"}
              onAction={hasActiveFilters ? clearAllFilters : () => setShowAddModal(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Organization</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Workspaces</th>
                  <th className="py-3 px-3">Members / Limit</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orgData.organizations.map((org) => {
                  const initial = org.companyName?.charAt(0).toUpperCase() || "O";
                  const memberRatio =
                    org.memberLimit && org.memberLimit > 0
                      ? `${org.membersCount} / ${org.memberLimit}`
                      : `${org.membersCount}`;

                  return (
                    <tr
                      key={org._id}
                      onClick={() => navigate(API_ROUTES.SUPER_ADMIN.NAV.ORGANIZATION_DETAIL(org._id))}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Organization Column */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0 max-w-[180px] sm:max-w-[220px]">
                            <p className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                              {org.companyName}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono truncate">
                              /{org.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner Column */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0 max-w-[160px]">
                          <p className="font-medium text-gray-900 truncate">{org.ownerName}</p>
                          <p className="text-[11px] text-gray-400 truncate">{org.ownerEmail}</p>
                        </div>
                      </td>

                      {/* Plan Column */}
                      <td className="py-3.5 px-3">
                        {renderPlanBadge(org)}
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-3">
                        {renderStatusBadge(org.status)}
                      </td>

                      {/* Workspaces Column */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1 font-mono text-gray-700 font-semibold">
                          <Layers className="w-3.5 h-3.5 text-gray-400" />
                          <span>{org.workspacesCount}</span>
                        </div>
                      </td>

                      {/* Members / Limit Column */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span
                            className={
                              org.nearLimit
                                ? "text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded"
                                : "text-gray-700 font-medium"
                            }
                          >
                            {memberRatio}
                          </span>
                        </div>
                      </td>

                      {/* Last Activity Column */}
                      <td className="py-3.5 px-4">
                        <span
                          className="text-gray-600 text-xs cursor-help"
                          title={formatAbsoluteTime(org.lastActivity || undefined)}
                        >
                          {formatRelativeTime(org.lastActivity || undefined)}
                        </span>
                      </td>

                      {/* Created Column */}
                      <td className="py-3.5 px-4 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(org.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions Column */}
                      <td
                        className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1 relative">
                          {/* Primary View Action */}
                          <button
                            type="button"
                            onClick={() => navigate(API_ROUTES.SUPER_ADMIN.NAV.ORGANIZATION_DETAIL(org._id))}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* "..." Menu Button */}
                          <button
                            type="button"
                            aria-label={`More options for ${org.companyName}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpenId((prev) => (prev === org._id ? null : org._id));
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Action Dropdown Menu */}
                          {actionMenuOpenId === org._id && (
                            <div
                              role="menu"
                              className="absolute right-0 top-9 w-48 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 z-40 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Edit details */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  setEditModalOrg(org);
                                  setEditForm({
                                    companyName: org.companyName,
                                    slug: org.slug,
                                    ownerName: org.ownerName,
                                    ownerEmail: org.ownerEmail,
                                  });
                                }}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                role="menuitem"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                <span>Edit Organization</span>
                              </button>

                              {/* Change plan */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  setChangePlanModalOrg(org);
                                  setSelectedNewPlanId(org.planId);
                                }}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                role="menuitem"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                                <span>Change Plan</span>
                              </button>

                              <div className="my-1 border-t border-gray-100" />

                              {/* Suspend / Reactivate */}
                              {org.status === "active" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuOpenId(null);
                                    setStatusModalOrg({ org, targetStatus: "suspended" });
                                  }}
                                  className="flex items-center gap-2.5 w-full px-3 py-2 text-amber-700 hover:bg-amber-50 font-medium transition-colors"
                                  role="menuitem"
                                >
                                  <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Suspend Access</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuOpenId(null);
                                    setStatusModalOrg({ org, targetStatus: "active" });
                                  }}
                                  className="flex items-center gap-2.5 w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 font-medium transition-colors"
                                  role="menuitem"
                                >
                                  <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Reactivate Organization</span>
                                </button>
                              )}

                              {/* Archive */}
                              {org.status !== "archived" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuOpenId(null);
                                    setStatusModalOrg({ org, targetStatus: "archived" });
                                  }}
                                  className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                  role="menuitem"
                                >
                                  <Archive className="w-3.5 h-3.5 text-gray-400" />
                                  <span>Archive Organization</span>
                                </button>
                              )}

                              {/* Delete (Soft Delete) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  setDeleteModalOrg(org);
                                  setDeleteInputName("");
                                }}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                                role="menuitem"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete (Archive)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: Single Unified Footer with Showing X-Y of N, Page Size Selector, Prev/Next */}
        {orgData && orgData.total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
            {/* Left: Showing X-Y of N */}
            <div className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-900">
                {(page - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-gray-900">
                {Math.min(page * pageSize, orgData.total)}
              </span>{" "}
              of <span className="font-bold text-gray-900">{orgData.total}</span> organizations
            </div>

            {/* Right: Page Size Selector + Prev/Next Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <span className="px-2 text-xs font-semibold text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Suspend / Reactivate / Archive Consequence Modal */}
      {statusModalOrg && (
        <ConfirmDialog
          isOpen={Boolean(statusModalOrg)}
          title={
            statusModalOrg.targetStatus === "suspended"
              ? `Suspend ${statusModalOrg.org.companyName}?`
              : statusModalOrg.targetStatus === "archived"
              ? `Archive ${statusModalOrg.org.companyName}?`
              : `Reactivate ${statusModalOrg.org.companyName}?`
          }
          message={
            <div className="space-y-2 text-xs text-gray-600">
              {statusModalOrg.targetStatus === "suspended" && (
                <>
                  <p>
                    Suspending <span className="font-bold text-gray-900">{statusModalOrg.org.companyName}</span> will immediately halt member logins, restrict all{" "}
                    <span className="font-bold text-gray-900">{statusModalOrg.org.workspacesCount} workspaces</span>, and terminate live room sessions.
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Existing data will remain intact, and organization owners will receive a notification to resolve their account status.
                  </p>
                </>
              )}
              {statusModalOrg.targetStatus === "active" && (
                <p>
                  Reactivating will restore full access for all workspaces and members of{" "}
                  <span className="font-bold text-gray-900">{statusModalOrg.org.companyName}</span>.
                </p>
              )}
              {statusModalOrg.targetStatus === "archived" && (
                <p>
                  Archiving will soft-delete this organization. Its workspaces and logs will remain preserved in audit records.
                </p>
              )}
            </div>
          }
          confirmLabel={
            statusModalOrg.targetStatus === "suspended"
              ? "Suspend Access"
              : statusModalOrg.targetStatus === "archived"
              ? "Archive Organization"
              : "Reactivate"
          }
          isDestructive={statusModalOrg.targetStatus !== "active"}
          isLoading={modalLoading}
          onConfirm={handleStatusChangeConfirm}
          onCancel={() => setStatusModalOrg(null)}
        />
      )}

      {/* 2. Delete Confirmation Modal (Requires typing exact org name) */}
      {deleteModalOrg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Delete {deleteModalOrg.companyName}?
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  This action will soft-delete (archive) this organization and disable its{" "}
                  <span className="font-bold text-gray-800">{deleteModalOrg.workspacesCount} workspaces</span> and{" "}
                  <span className="font-bold text-gray-800">{deleteModalOrg.membersCount} members</span>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-xs text-gray-700">
              <p>
                To confirm deletion, please type{" "}
                <span className="font-bold select-all text-gray-900">
                  {deleteModalOrg.companyName}
                </span>{" "}
                below:
              </p>
              <input
                type="text"
                value={deleteInputName}
                onChange={(e) => setDeleteInputName(e.target.value)}
                placeholder={deleteModalOrg.companyName}
                className="w-full mt-2 px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOrg(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteInputName.trim() !== deleteModalOrg.companyName.trim() || modalLoading}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                {modalLoading ? "Deleting..." : "Permanently Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Change Plan Modal */}
      {changePlanModalOrg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Change Subscription Plan</h3>
              </div>
              <button
                type="button"
                onClick={() => setChangePlanModalOrg(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Select the new plan tier for{" "}
              <span className="font-bold text-gray-900">{changePlanModalOrg.companyName}</span>.
              This modifies workspace limits and capacity instantly.
            </p>

            <div className="space-y-2.5">
              {orgData?.plans.map((p) => {
                const isSelected = selectedNewPlanId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedNewPlanId(p.id)}
                    className={`flex items-center justify-between w-full p-3 rounded-xl border text-xs text-left transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/10"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-gray-900 block">{p.name} Plan</span>
                      <span className="text-[11px] text-gray-500">
                        {p.price === 0 ? "Standard limits" : "Advanced limits & priority audio"}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-gray-900">
                      {p.price === 0 ? "Free" : `$${p.price}/mo`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setChangePlanModalOrg(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalLoading || !selectedNewPlanId}
                onClick={handleChangePlanConfirm}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs disabled:opacity-40"
              >
                {modalLoading ? "Saving..." : "Apply Plan Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit Organization Modal */}
      {editModalOrg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Edit Organization</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOrg(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditConfirm} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editForm.companyName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={editForm.slug}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  required
                  value={editForm.ownerName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, ownerName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Owner Email</label>
                <input
                  type="email"
                  required
                  value={editForm.ownerEmail}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, ownerEmail: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOrg(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs disabled:opacity-40"
                >
                  {modalLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Organization Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Provision New Organization</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Send an invitation to a new organization owner. They will complete onboarding and configure their workspace.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={addForm.companyName}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Primary Owner Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={addForm.ownerName}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, ownerName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Owner Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="owner@acme.com"
                  value={addForm.ownerEmail}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, ownerEmail: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs disabled:opacity-40"
                >
                  {modalLoading ? "Sending Invite..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
