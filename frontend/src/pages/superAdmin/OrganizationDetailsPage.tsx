import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Users,
  Layers,
  CreditCard,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  MoreVertical,
  Edit2,
  PauseCircle,
  PlayCircle,
  Trash2,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  getSuperAdminOrganizationDetails,
  updateSuperAdminOrganizationStatus,
  updateSuperAdminOrganizationPlan,
  updateSuperAdminOrganizationDetails,
  deleteSuperAdminOrganization,
} from "../../services/superAdminServices";
import type {
  IOrganizationDetailData,
} from "../../services/superAdminServices";
import { API_ROUTES } from "../../constants/Api_Routes";
import { formatRelativeTime, formatAbsoluteTime } from "../../components/common/formatters";
import EmptyState from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { MembersTable } from "../../components/common/MembersTable";
import type { MemberRowData, SortField } from "../../components/common/MembersTable";

type TabKey = "overview" | "workspaces" | "members" | "subscription" | "activity";

export default function OrganizationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = (searchParams.get("tab") as TabKey) || "overview";

  const [data, setData] = useState<IOrganizationDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Members table sorting state
  const [memberSortField, setMemberSortField] = useState<SortField>("name");
  const [memberSortOrder, setMemberSortOrder] = useState<"asc" | "desc">("asc");

  // Modals state
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState<"suspended" | "active" | "archived" | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteInputName, setDeleteInputName] = useState("");
  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ companyName: "", slug: "", ownerName: "", ownerEmail: "" });
  const [modalLoading, setModalLoading] = useState(false);

  const loadDetails = useCallback(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getSuperAdminOrganizationDetails(id)
      .then((res) => {
        if (!cancelled && res?.data) {
          setData(res.data);
          setSelectedPlanId(res.data.organization.planId);
          setEditForm({
            companyName: res.data.organization.companyName,
            slug: res.data.organization.slug,
            ownerName: res.data.organization.ownerName,
            ownerEmail: res.data.organization.ownerEmail,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Failed to load organization details.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return loadDetails();
  }, [loadDetails]);

  const handleTabChange = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    setSearchParams(params);
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Status Change
  const handleStatusChange = async (targetStatus: "active" | "suspended" | "archived") => {
    if (!id) return;
    setModalLoading(true);
    try {
      await updateSuperAdminOrganizationStatus(id, targetStatus);
      setToastMessage({ type: "success", text: `Organization status set to ${targetStatus}.` });
      setStatusConfirmOpen(null);
      loadDetails();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setToastMessage({ type: "error", text: e?.response?.data?.message || "Failed to update status." });
    } finally {
      setModalLoading(false);
    }
  };

  // Plan Change
  const handlePlanChange = async () => {
    if (!id || !selectedPlanId) return;
    setModalLoading(true);
    try {
      await updateSuperAdminOrganizationPlan(id, selectedPlanId);
      setToastMessage({ type: "success", text: "Subscription plan updated successfully." });
      setChangePlanModalOpen(false);
      loadDetails();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setToastMessage({ type: "error", text: e?.response?.data?.message || "Failed to change plan." });
    } finally {
      setModalLoading(false);
    }
  };

  // Edit details
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setModalLoading(true);
    try {
      await updateSuperAdminOrganizationDetails(id, editForm);
      setToastMessage({ type: "success", text: "Organization details updated successfully." });
      setEditModalOpen(false);
      loadDetails();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setToastMessage({ type: "error", text: e?.response?.data?.message || "Failed to update details." });
    } finally {
      setModalLoading(false);
    }
  };

  // Delete (archive)
  const handleDeleteConfirm = async () => {
    if (!id || !data) return;
    if (deleteInputName.trim() !== data.organization.companyName.trim()) {
      setToastMessage({ type: "error", text: "Organization name does not match." });
      return;
    }
    setModalLoading(true);
    try {
      await deleteSuperAdminOrganization(id);
      setToastMessage({ type: "success", text: "Organization archived successfully." });
      navigate(API_ROUTES.SUPER_ADMIN.NAV.ORGANIZATIONS);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setToastMessage({ type: "error", text: e?.response?.data?.message || "Failed to delete organization." });
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded-lg" />
        <div className="h-28 bg-white border border-gray-200 rounded-2xl p-6" />
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <EmptyState
          icon={Building2}
          title="Organization not found"
          description={error || "The requested organization does not exist or may have been deleted."}
          actionLabel="Return to Organizations"
          onAction={() => navigate(API_ROUTES.SUPER_ADMIN.NAV.ORGANIZATIONS)}
        />
      </div>
    );
  }

  const { organization: org, owner, kpis, workspaces, subscription, recentActivities } = data;

  const memberRows: MemberRowData[] = owner
    ? [
        {
          _id: owner._id || "owner",
          username: owner.username,
          email: owner.email,
          role: owner.role,
          status: owner.status,
          isOnline: kpis.onlineNow > 0,
          isOwner: true,
        },
      ]
    : [];

  const workspaceLimitPct = Math.min(100, Math.round((workspaces.length / (org.maxWorkspaces || 1)) * 100));
  const memberLimitPct = Math.min(100, Math.round((kpis.membersCount / (kpis.memberLimit || 1)) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium animate-in fade-in duration-200 ${
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

      {/* Back button */}
      <div>
        <Link
          to={API_ROUTES.SUPER_ADMIN.NAV.ORGANIZATIONS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Organizations</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold text-xl shadow-xs shrink-0">
            {org.companyName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {org.companyName}
              </h1>
              {/* Status Badge */}
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  org.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : org.status === "suspended"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
              </span>
              {/* Plan Badge */}
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  org.planMissing
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}
              >
                {org.planMissing ? "Unknown plan" : `${org.planName} Plan`}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 flex-wrap">
              <span className="font-mono text-[11px]">/{org.slug}</span>
              <span>•</span>
              <span>Owner: <strong className="text-gray-700">{org.ownerName}</strong> ({org.ownerEmail})</span>
              <span>•</span>
              <span>Created {new Date(org.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Actions Dropdown */}
        <div className="relative shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={() => setActionMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <span>Organization Actions</span>
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {actionMenuOpen && (
            <div
              className="absolute right-0 top-10 w-48 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 z-40 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setActionMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 font-medium"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Edit Details</span>
              </button>
              <button
                type="button"
                onClick={() => setChangePlanModalOpen(true)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 font-medium"
              >
                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                <span>Change Plan</span>
              </button>
              <div className="my-1 border-t border-gray-100" />
              {org.status === "active" ? (
                <button
                  type="button"
                  onClick={() => setStatusConfirmOpen("suspended")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-amber-700 hover:bg-amber-50 font-medium"
                >
                  <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Suspend Access</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStatusConfirmOpen("active")}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 font-medium"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reactivate</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete (Archive)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compact IDs row with copy buttons */}
      <div className="bg-white rounded-xl border border-gray-200/80 px-4 py-2.5 flex items-center gap-6 text-xs text-gray-500 overflow-x-auto">
        <span className="font-semibold text-gray-700 uppercase tracking-wider text-[10px]">
          System IDs:
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-gray-400">Org:</span>
          <span className="font-mono text-[11px] text-gray-800">{org._id}</span>
          <button
            type="button"
            onClick={() => copyToClipboard("org", org._id)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="Copy Organization ID"
          >
            {copiedKey === "org" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {owner?._id && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-gray-400">Owner:</span>
            <span className="font-mono text-[11px] text-gray-800">{owner._id}</span>
            <button
              type="button"
              onClick={() => copyToClipboard("owner", owner._id!)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title="Copy Owner ID"
            >
              {copiedKey === "owner" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-gray-400">Plan:</span>
          <span className="font-mono text-[11px] text-gray-800">{org.planId}</span>
          <button
            type="button"
            onClick={() => copyToClipboard("plan", org.planId)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="Copy Plan ID"
          >
            {copiedKey === "plan" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6" aria-label="Tabs">
          {(["overview", "workspaces", "members", "subscription", "activity"] as TabKey[]).map((tab) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`py-3 px-1 border-b-2 text-xs font-semibold capitalize transition-all ${
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
                {tab === "workspaces" && ` (${workspaces.length})`}
                {tab === "members" && ` (${kpis.membersCount})`}
              </button>
            );
          })}
        </nav>
      </div>

      {/* --- TAB CONTENT --- */}

      {/* Tab 1: Overview */}
      {currentTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Workspaces
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {workspaces.length}{" "}
                <span className="text-xs font-normal text-gray-400">/ {org.maxWorkspaces}</span>
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Members
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {kpis.membersCount}{" "}
                <span className="text-xs font-normal text-gray-400">/ {kpis.memberLimit}</span>
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Online Now
              </span>
              <p className="text-2xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                {kpis.onlineNow}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Meetings (30d)
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.meetings30d}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Meeting Duration
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.formattedMeetingDuration}</p>
            </div>
          </div>

          {/* Plan Usage Capacity Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-900">Workspace Usage</h3>
                </div>
                <span className="text-xs font-mono font-bold text-gray-900">
                  {workspaces.length} / {org.maxWorkspaces} ({workspaceLimitPct}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    workspaceLimitPct >= 80 ? "bg-amber-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${workspaceLimitPct}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Allocated under the {org.planName} tier ({org.maxWorkspaces} max workspaces permitted).
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-600" />
                  <h3 className="text-sm font-bold text-gray-900">Member Capacity</h3>
                </div>
                <span className="text-xs font-mono font-bold text-gray-900">
                  {kpis.membersCount} / {kpis.memberLimit} ({memberLimitPct}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    memberLimitPct >= 80 ? "bg-amber-500" : "bg-violet-600"
                  }`}
                  style={{ width: `${memberLimitPct}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Calculated member capacity across all provisioned workspaces.
              </p>
            </div>
          </div>

          {/* Owner Card & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Owner Info Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">Organization Owner</h3>
              </div>

              {owner ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Name</span>
                    <span className="font-semibold text-gray-900 text-sm">{owner.username}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Email</span>
                    <span className="font-mono text-gray-800">{owner.email}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Account
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Owner account details unlinked</p>
              )}
            </div>

            {/* Recent Activities Feed */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-900">Recent Organization Audit Events</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("activity")}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  View all
                </button>
              </div>

              {recentActivities.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No audit logs recorded for this organization.</p>
              ) : (
                <div className="divide-y divide-gray-100 text-xs">
                  {recentActivities.slice(0, 5).map((act) => (
                    <div key={act.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{act.action}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{act.details}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Workspaces */}
      {currentTab === "workspaces" && (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Organization Workspaces ({workspaces.length})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Workspaces currently active or archived under {org.companyName}
              </p>
            </div>
          </div>

          {workspaces.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No workspaces have been provisioned under this organization yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Workspace Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Members</th>
                    <th className="py-3 px-4">Rooms</th>
                    <th className="py-3 px-6 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workspaces.map((ws) => (
                    <tr key={ws._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-gray-900">
                        {ws.workspaceName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ws.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-mono font-medium">
                        {ws.membersCount}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-mono font-medium">
                        {ws.roomsCount}
                      </td>
                      <td className="py-3.5 px-6 text-right text-gray-500 text-xs">
                        {new Date(ws.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Members */}
      {currentTab === "members" && (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Organization Members & Owner
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                All registered users with workspace access or administrator rights in {org.companyName}
              </p>
            </div>
          </div>

          <div className="p-4">
            <MembersTable
              users={memberRows}
              loading={false}
              error={null}
              sortField={memberSortField}
              sortOrder={memberSortOrder}
              onSort={(field) => {
                if (memberSortField === field) {
                  setMemberSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                } else {
                  setMemberSortField(field);
                  setMemberSortOrder("asc");
                }
              }}
              allowedRowActions={{
                viewProfile: true,
                changeRole: false,
                toggleStatus: false,
                remove: false,
              }}
              page={1}
              totalPages={1}
              totalCount={memberRows.length}
              onPageChange={() => {}}
            />
          </div>
        </div>
      )}

      {/* Tab 4: Subscription */}
      {currentTab === "subscription" && (
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Current Subscription Tier</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Billing plan details, active quotas, and tier features
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChangePlanModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs self-start sm:self-auto"
            >
              Change Subscription Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/60 space-y-2">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
                Active Plan
              </span>
              <p className="text-xl font-bold text-indigo-950">{subscription.planName} Plan</p>
              <p className="text-sm font-mono font-bold text-indigo-700">
                {subscription.price === 0 ? "Free Tier" : `$${subscription.price} / month`}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Workspace Quota
              </span>
              <p className="text-xl font-bold text-gray-900">{subscription.maxWorkspaces} Workspaces</p>
              <p className="text-xs text-gray-500">{workspaces.length} currently deployed</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Billing Status
              </span>
              <p className="text-xl font-bold text-emerald-700">{subscription.status}</p>
              <p className="text-xs text-gray-500">Managed via AudioHive Billing Engine</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              Included Tier Features
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(subscription.features.length > 0 ? subscription.features : [
                "HD Audio & Video Conferencing",
                "Unlimited Instant Whiteboards",
                "Standard AudioHive Support",
                "Real-time Direct & Channel Chat",
              ]).map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Activity */}
      {currentTab === "activity" && (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">
              Audit Logs & Administrative Actions
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Historical timeline of organization modifications, status changes, and administrator operations
            </p>
          </div>

          {recentActivities.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No audit activities recorded for this organization yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 text-xs">
              {recentActivities.map((act) => (
                <div key={act.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{act.action}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        {act.actorName}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-1">{act.details}</p>
                  </div>
                  <span className="text-gray-400 text-[11px] whitespace-nowrap">
                    {formatAbsoluteTime(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Suspend / Reactivate Confirm Dialog */}
      {statusConfirmOpen && (
        <ConfirmDialog
          isOpen={Boolean(statusConfirmOpen)}
          title={
            statusConfirmOpen === "suspended"
              ? `Suspend ${org.companyName}?`
              : `Reactivate ${org.companyName}?`
          }
          message={
            statusConfirmOpen === "suspended" ? (
              <p>
                Suspending this organization will disable login access for all {workspaces.length} workspaces and {kpis.membersCount} members.
              </p>
            ) : (
              <p>
                Reactivating will restore full platform access for all organization workspaces and members.
              </p>
            )
          }
          confirmLabel={statusConfirmOpen === "suspended" ? "Suspend Access" : "Reactivate"}
          isDestructive={statusConfirmOpen === "suspended"}
          isLoading={modalLoading}
          onConfirm={() => handleStatusChange(statusConfirmOpen)}
          onCancel={() => setStatusConfirmOpen(null)}
        />
      )}

      {/* Delete Confirmation Modal (Requires typing name) */}
      {deleteModalOpen && (
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
                  Delete {org.companyName}?
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  This action will soft-delete (archive) this organization and disable its {workspaces.length} workspaces.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700">
              <p>
                To confirm deletion, please type <span className="font-bold select-all text-gray-900">{org.companyName}</span> below:
              </p>
              <input
                type="text"
                value={deleteInputName}
                onChange={(e) => setDeleteInputName(e.target.value)}
                placeholder={org.companyName}
                className="w-full mt-2 px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteInputName.trim() !== org.companyName.trim() || modalLoading}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                {modalLoading ? "Deleting..." : "Permanently Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {changePlanModalOpen && (
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
                onClick={() => setChangePlanModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Select the new plan tier for <span className="font-bold text-gray-900">{org.companyName}</span>.
            </p>

            <div className="space-y-2.5">
              {[
                { id: "free", name: "Free", price: 0 },
                { id: "6a86bb89874ad3e6e0524d05", name: "Pro", price: 199 },
              ].map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`flex items-center justify-between w-full p-3 rounded-xl border text-xs text-left transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/10"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-gray-900 block">{p.name} Plan</span>
                      <span className="text-[11px] text-gray-500">
                        {p.price === 0 ? "Standard workspaces" : "5 Workspaces & HD Priority"}
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
                onClick={() => setChangePlanModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalLoading}
                onClick={handlePlanChange}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs disabled:opacity-40"
              >
                {modalLoading ? "Saving..." : "Apply Plan Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {editModalOpen && (
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
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
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
                  onClick={() => setEditModalOpen(false)}
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
    </div>
  );
}
